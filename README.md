# CyberBot - CTF & Kybernetická bezpečnost

AI chatbot pro CTF soutěže a kybernetickou bezpečnost. Běží na Gemini API, odpovídá česky.

## Stack
- **Frontend**: React + Vite → Vercel
- **Backend**: FastAPI (Python) → Railway
- **AI**: Google Gemini 1.5 Flash (free tier)

## Lokální vývoj

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Nastav API klíč
export GEMINI_API_KEY=your_key_here

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

# Vytvoř .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
```

## Deployment

### 1. Gemini API klíč
Získej zdarma na: https://aistudio.google.com/app/apikey

### 2. Railway (backend)
1. Jdi na https://railway.app a přihlaš se přes GitHub
2. New Project → Deploy from GitHub repo → vyber složku `backend`
3. Variables → přidej `GEMINI_API_KEY=your_key`
4. Zkopíruj vygenerovanou URL (např. `https://ctf-chatbot.railway.app`)

### 3. Vercel (frontend)
1. Jdi na https://vercel.com a přihlaš se přes GitHub
2. Import project → vyber složku `frontend`
3. Environment Variables → přidej `VITE_API_URL=https://your-backend.railway.app`
4. Deploy

## Struktura projektu

```
ctf-chatbot/
├── backend/
│   ├── main.py              # FastAPI app + Gemini integrace
│   ├── requirements.txt
│   ├── railway.toml         # Railway konfigurace
│   ├── Procfile
│   └── knowledge/           # Znalostní báze (markdown)
│       ├── nmap.md
│       ├── gobuster.md
│       ├── privesc.md
│       ├── reverse-shell.md
│       └── capabilities.md
└── frontend/
    ├── src/
    │   ├── App.jsx           # Hlavní komponenta
    │   ├── components/
    │   │   ├── MessageBubble.jsx   # Vykreslení zpráv + markdown
    │   │   └── InputArea.jsx       # Input + quick commands
    │   └── index.css
    ├── vite.config.js
    ├── vercel.json
    └── package.json
```

## Rozšíření znalostní báze

Přidej libovolný `.md` soubor do `backend/knowledge/` — bot ho automaticky načte při startu.
