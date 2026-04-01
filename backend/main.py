import os
import glob
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI(title="CTF Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    model_name="gemini-1.5-flash",
    system_instruction=SYSTEM_PROMPT,
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

class ChatResponse(BaseModel):
    response: str

@app.get("/health")
def health():
    return {"status": "ok", "knowledge_files": len(list(KNOWLEDGE_DIR.glob("*.md")))}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    history = []
    for msg in request.messages[:-1]:
        role = "user" if msg.role == "user" else "model"
        history.append({"role": role, "parts": [msg.content]})

    chat_session = model.start_chat(history=history)
    last_message = request.messages[-1].content

    try:
        response = chat_session.send_message(last_message)
        return ChatResponse(response=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
