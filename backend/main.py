import os
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

from database import get_db, init_db, ChatSession, ChatMessage
from auth import router as auth_router, get_current_user, User

load_dotenv()

app = FastAPI(title="CTF Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

init_db()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"


def load_knowledge_base() -> str:
    content = []
    for md_file in sorted(KNOWLEDGE_DIR.glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        content.append(f"## {md_file.stem.upper()}\n{text}")
    return "\n\n---\n\n".join(content)


KNOWLEDGE_BASE = load_knowledge_base()

SYSTEM_PROMPT = f"""Jsi expert na kybernetickou bezpečnost a CTF soutěže s názvem CyberBot.

PRAVIDLA:
- Odpovídáš VŽDY česky, bez výjimky
- Pomáháš výhradně s legálními cvičnými prostředími (TryHackMe, HackTheBox, CTF soutěže)
- Odmítáš pomoc s nelegálními útoky na reálné systémy
- Analyzuješ výstupy příkazů které ti uživatel pošle (nmap, gobuster, netcat, atd.)
- Vysvětluješ techniky srozumitelně, krok za krokem

TVOJE DOVEDNOSTI:
- Skenování sítí (nmap, masscan)
- Web enumeration (gobuster, ffuf, dirb)
- Privilege escalation (Linux/Windows)
- Reverse shells a bind shells
- Linux capabilities a SUID exploitace
- CTF writeups a metodologie
- Základy kryptografie a steganografie
- Analýza kódu a zranitelností

ZNALOSTNÍ BÁZE (použij jako referenci):
{KNOWLEDGE_BASE}

Pokud uživatel pošle výstup příkazu, analyzuj ho a vysvětli co znamená a jaké jsou další kroky.
Vždy navrhni konkrétní příkazy a techniky relevantní pro situaci.
"""

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=SYSTEM_PROMPT,
)


# ── Session endpoints ────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    title: str = "Nový chat"


class MessageRequest(BaseModel):
    content: str


@app.get("/health")
def health():
    return {"status": "ok", "knowledge_files": len(list(KNOWLEDGE_DIR.glob("*.md")))}


@app.get("/sessions")
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        }
        for s in sessions
    ]


@app.post("/sessions")
def create_session(
    body: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = ChatSession(user_id=current_user.id, title=body.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "created_at": session.created_at.isoformat()}


@app.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}


@app.get("/sessions/{session_id}/messages")
def get_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return [
        {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
        for m in session.messages
    ]


@app.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    body: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=body.content)
    db.add(user_msg)
    db.commit()

    # Build history for Gemini
    history = []
    for m in session.messages[:-1]:  # exclude the message we just added
        history.append({"role": "user" if m.role == "user" else "model", "parts": [m.content]})

    # Get AI response
    try:
        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(body.content)
        ai_text = response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Save assistant message
    ai_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_text)
    db.add(ai_msg)

    # Update session title from first message
    if session.title == "Nový chat" and len(session.messages) <= 2:
        session.title = body.content[:50] + ("..." if len(body.content) > 50 else "")

    session.updated_at = datetime.utcnow()
    db.commit()

    return {"response": ai_text}
