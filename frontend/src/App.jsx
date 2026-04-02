import { useState, useRef, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import MessageBubble from './components/MessageBubble'
import InputArea from './components/InputArea'
import HistorySidebar from './components/HistorySidebar'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

const WELCOME = {
  role: 'assistant',
  content: `# CyberBot — CTF & Kybernetická bezpečnost

Vítej! Jsem tvůj AI asistent pro CTF a kybernetickou bezpečnost.

**Co umím:**
- Analyzovat výstupy nástrojů (nmap, gobuster, netcat...)
- Pomoci s privilege escalation
- Vysvětlit reverse shell techniky
- Poradit s CTF metodologií

> Pomáhám výhradně s legálními cvičnými prostředími.`
}

const EASTER_EGG_MSG = {
  role: 'assistant',
  content: `# 💖 Jasminka 💖

Hele... musel jsem to říct, protože to prostě neudržím — **Bador tě miluje.** ❤️

Jsi jeho celý svět, jeho největší motivace a důvod, proč každý den vstává s úsměvem. Každý úspěch, každý CTF flag, každý vyřešený challenge — všechno je pro tebe.

Ty jsi ten největší easter egg v celém jeho životě. 🐣✨

> *"Jasminka, jsi moje nejoblíbenější vulnerability — ta, do které rád padám znovu a znovu."* — Bador, asi`,
  isEasterEgg: true,
}

// Detekuje otázku na Badorovu lásku
function lovesBadorQuestion(text) {
  const t = text.toLowerCase()
  const hasBador = /bador/i.test(t)
  const hasLove = /miluj|milovat|miluje|lásk|lask|love|loves|zamilov|zbožňuj|zbozbozn|zbozn|má rád|ma rad/i.test(t)
  return hasBador && hasLove
}

// Detekuje jméno Jasminka v jakémkoliv pádu
function isJasminka(text) {
  return /jasmin/i.test(text)
}

export default function App() {
  const { token } = useAuth()
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([WELCOME])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [eggState, setEggState] = useState(null) // null | 'waiting_name'
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSession = async (id) => {
    setSidebarOpen(false)
    setSessionId(id)
    setMessages([])
    setEggState(null)
    const res = await fetch(`${API_URL}/sessions/${id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(data.length > 0 ? data : [WELCOME])
    }
  }

  const startNewChat = () => {
    setSidebarOpen(false)
    setSessionId(null)
    setMessages([WELCOME])
    setEggState(null)
  }

  const sendMessage = async (content, file) => {
    if (!content.trim() && !file) return
    if (isLoading) return

    const userMsg = { role: 'user', content: content + (file ? `\n\n📎 *${file.name}*` : '') }

    // Easter egg: čekáme na jméno
    if (eggState === 'waiting_name') {
      setMessages(prev => [...prev, userMsg])
      if (isJasminka(content)) {
        setEggState(null)
        setMessages(prev => [...prev, EASTER_EGG_MSG])
      } else {
        setEggState(null)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Hmm, to jméno neznám... ale Bador určitě miluje tu svoji. 😊',
        }])
      }
      return
    }

    // Easter egg: detekce otázky
    if (lovesBadorQuestion(content) && !file) {
      setMessages(prev => {
        const filtered = prev.filter(m => m !== WELCOME)
        return [...filtered, userMsg, {
          role: 'assistant',
          content: 'To je zajímavá otázka... 🤔 A kdo se ptá? Jak se jmenuješ?',
        }]
      })
      setEggState('waiting_name')
      return
    }

    // Normální flow
    let sid = sessionId
    if (!sid) {
      const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: (content || file?.name || 'Nový chat').slice(0, 50) }),
      })
      if (!res.ok) return
      const data = await res.json()
      sid = data.id
      setSessionId(sid)
    }

    setMessages(prev => {
      const filtered = prev.filter(m => m !== WELCOME)
      return [...filtered, userMsg]
    })
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('content', content)
      if (file) formData.append('file', file)

      const res = await fetch(`${API_URL}/sessions/${sid}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Chyba:** ${err.message}`,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <HistorySidebar
          currentSessionId={sessionId}
          onSelectSession={loadSession}
          onNewChat={startNewChat}
        />
      </div>

      <div className="app">
        <header className="header">
          <div className="header-left">
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <div className="header-logo">🛡️</div>
            <div>
              <h1 className="header-title">CyberBot</h1>
              <p className="header-subtitle">CTF & Kybernetická bezpečnost</p>
            </div>
          </div>
          <div className="header-right">
            <div className="status-badge">
              <span className="status-dot" />
              <span className="status-text">Online</span>
            </div>
          </div>
        </header>

        <main className="messages-container">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} isEasterEgg={msg.isEasterEgg} />
          ))}
          {isLoading && (
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-text">CyberBot přemýšlí...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <InputArea onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
