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

export default function App() {
  const { token } = useAuth()
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([WELCOME])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSession = async (id) => {
    setSidebarOpen(false)
    setSessionId(id)
    setMessages([])
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
  }

  const sendMessage = async (content, file) => {
    if (!content.trim() && !file) return
    if (isLoading) return

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

    // Zobraz zprávu uživatele
    const displayContent = content + (file ? `\n\n📎 *${file.name}*` : '')
    setMessages(prev => {
      const filtered = prev.filter(m => m !== WELCOME)
      return [...filtered, { role: 'user', content: displayContent }]
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
      {/* Overlay pro zavření sidebaru na mobilu */}
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
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>
              ☰
            </button>
            <span className="header-icon">{'>'}_</span>
            <div>
              <h1 className="header-title">CyberBot</h1>
              <p className="header-subtitle">CTF & Kybernetická bezpečnost</p>
            </div>
          </div>
          <div className="header-right">
            <span className="status-dot" />
            <span className="status-text">Online</span>
          </div>
        </header>

        <main className="messages-container">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
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
