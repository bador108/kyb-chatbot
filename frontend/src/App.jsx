import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([WELCOME])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSession = async (id) => {
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
    setSessionId(null)
    setMessages([WELCOME])
  }

  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return

    // Create session if none
    let sid = sessionId
    if (!sid) {
      const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: content.slice(0, 50) }),
      })
      if (!res.ok) return
      const data = await res.json()
      sid = data.id
      setSessionId(sid)
    }

    setMessages(prev => {
      const filtered = prev.filter(m => m !== WELCOME)
      return [...filtered, { role: 'user', content }]
    })
    setIsLoading(true)

    try {
      const res = await fetch(`${API_URL}/sessions/${sid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
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
      <HistorySidebar
        currentSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={startNewChat}
      />
      <div className="app">
        <header className="header">
          <div className="header-left">
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
