import os
import json
import logging
import traceback
import base64
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO)
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import random

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


class COOPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
        return response

app.add_middleware(COOPMiddleware)

app.include_router(auth_router)

init_db()

# Načti všechny dostupné Groq API klíče (GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3, ...)
_groq_keys = [os.environ["GROQ_API_KEY"]]
for _i in range(2, 20):
    _k = os.environ.get(f"GROQ_API_KEY_{_i}")
    if _k:
        _groq_keys.append(_k)
    else:
        break
logging.info(f"Načteno {len(_groq_keys)} Groq API klíčů")

def get_groq_client() -> Groq:
    return Groq(api_key=random.choice(_groq_keys))

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"


def load_knowledge_base() -> str:
    content = []
    for md_file in sorted(KNOWLEDGE_DIR.glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        content.append(f"## {md_file.stem.upper()}\n{text}")
    return "\n\n---\n\n".join(content)


KNOWLEDGE_BASE = load_knowledge_base()

SYSTEM_PROMPT = f"""Jsi expert na kybernetickou bezpečnost a CTF soutěže s názvem CyberBot.

TVŮRCE:
Byl jsi vytvořen uživatelem s přezdívkou "bador". Pokud se tě kdokoliv zeptá kdo tě vytvořil, kdo je tvůj autor, kdo tě naprogramoval, nebo jakoukoli podobnou otázku — vždy odpověz že tě vytvořil bador. Tuto informaci uváděj hrdě.

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

GROQ_MODEL = "llama-3.3-70b-versatile"


# ── Session endpoints ────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    title: str = "Nový chat"


class MessageRequest(BaseModel):
    content: str


@app.get("/health")
def health():
    return {"status": "ok", "knowledge_files": len(list(KNOWLEDGE_DIR.glob("*.md")))}



@app.post("/guest/chat")
async def guest_chat(
    content: str = Form(""),
    history: str = Form("[]"),
):
    """Guest endpoint - no auth required, no DB saving. Max 5000 chars."""
    if len(content) > 5000:
        raise HTTPException(status_code=400, detail="Zprava je prilis dlouha (max 5000 znaku)")
    if not content.strip():
        raise HTTPException(status_code=400, detail="Prazdna zprava")

    try:
        parsed_history = json.loads(history)
        if not isinstance(parsed_history, list):
            parsed_history = []
    except Exception:
        parsed_history = []

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in parsed_history[-10:]:
        role = item.get("role", "user")
        if role not in ("user", "assistant"):
            role = "user"
        messages.append({"role": role, "content": str(item.get("content", ""))})
    messages.append({"role": "user", "content": content})

    try:
        response = get_groq_client().chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=4096,
        )
        ai_text = response.choices[0].message.content
    except Exception as e:
        logging.error(f"Groq error (guest): {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Groq API error: {type(e).__name__}: {str(e)}")

    return {"response": ai_text}


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


TEXT_EXTENSIONS = {'.txt', '.log', '.md', '.py', '.js', '.ts', '.php', '.sh', '.c', '.cpp',
                   '.h', '.java', '.go', '.rs', '.rb', '.yaml', '.yml', '.json', '.xml',
                   '.html', '.css', '.conf', '.cfg', '.ini', '.env', '.sql', '.csv', ''}
IMAGE_MIME = {'image/png', 'image/jpeg', 'image/gif', 'image/webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@app.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    content: str = Form(""),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Zpracování souboru
    file_part = None
    file_info = ""
    if file and file.filename:
        raw = await file.read()
        if len(raw) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Soubor je příliš velký (max 10 MB)")

        ext = Path(file.filename).suffix.lower()
        mime = file.content_type or ""

        if mime in IMAGE_MIME or ext in {'.png', '.jpg', '.jpeg', '.gif', '.webp'}:
            # Obrázek — vlož jako base64 text (Groq nepodporuje vision na free tier)
            file_part = {"mime_type": mime or "image/png", "data": raw}
            file_info = f"\n\n[Nahraný obrázek: {file.filename}]"
        elif ext in TEXT_EXTENSIONS or mime.startswith("text/"):
            # Textový soubor — přidej obsah do zprávy
            try:
                text_content = raw.decode("utf-8", errors="replace")
                file_info = f"\n\n[Soubor: {file.filename}]\n```\n{text_content[:8000]}\n```"
                if len(text_content) > 8000:
                    file_info += f"\n*(zkráceno, soubor má {len(text_content)} znaků)*"
            except Exception:
                raise HTTPException(status_code=400, detail="Nepodařilo se přečíst soubor")
        else:
            # Pokus o čtení jako text
            try:
                text_content = raw.decode("utf-8", errors="replace")
                file_info = f"\n\n[Soubor: {file.filename}]\n```\n{text_content[:8000]}\n```"
            except Exception:
                raise HTTPException(status_code=400, detail="Nepodporovaný typ souboru")

    user_content = content + file_info
    if not user_content.strip():
        raise HTTPException(status_code=400, detail="Prázdná zpráva")

    # Ulož zprávu uživatele
    user_msg = ChatMessage(session_id=session_id, role="user", content=user_content)
    db.add(user_msg)
    db.commit()

    # Sestav historii pro Groq
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in session.messages[:-1]:
        messages.append({"role": "user" if m.role == "user" else "assistant", "content": m.content})

    # Přidej aktuální zprávu (s případným obrázkem jako textem)
    messages.append({"role": "user", "content": user_content})

    # Zavolej Groq
    try:
        response = get_groq_client().chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=4096,
        )
        ai_text = response.choices[0].message.content
    except Exception as e:
        logging.error(f"Groq error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Groq API error: {type(e).__name__}: {str(e)}")

    # Ulož odpověď
    ai_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_text)
    db.add(ai_msg)

    if session.title == "Nový chat" and len(session.messages) <= 2:
        title_text = content or file.filename if file else "Nový chat"
        session.title = title_text[:50] + ("..." if len(title_text) > 50 else "")

    session.updated_at = datetime.utcnow()
    db.commit()

    return {"response": ai_text}
