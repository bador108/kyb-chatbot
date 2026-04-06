import { useState, useRef, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import MessageBubble from './components/MessageBubble'
import InputArea from './components/InputArea'
import HistorySidebar from './components/HistorySidebar'
import LoginModal from './components/LoginModal'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
const GUEST_WARN_AFTER = 3
const GUEST_MAX = 10

const FEATURE_CARDS = [
  {
    icon: '⚡',
    title: 'Quick Commands',
    desc: 'Pre-built CTF queries for nmap, gobuster, netcat and more',
  },
  {
    icon: '📎',
    title: 'File Analysis',
    desc: 'Upload logs, scripts, and screenshots for instant analysis',
  },
  {
    icon: '🛡️',
    title: 'CTF Methodology',
    desc: 'Step-by-step privesc, enumeration and exploitation guidance',
  },
]

const CATEGORY_TABS = [
  { label: 'All', cmd: null },
  { label: 'Recon', cmd: 'Jak správně použít nmap na CTF?' },
  { label: 'Web', cmd: 'Ukázkový gobuster příkaz pro web enumeration?' },
  { label: 'Privesc', cmd: 'Jaké jsou první kroky pro privilege escalation na Linuxu?' },
  { label: 'RevShell', cmd: 'Jak získat a stabilizovat reverse shell?' },
  { label: 'Crypto', cmd: 'Jak rozpoznat typ šifrování v CTF?' },
]

const EASTER_EGG_MSG = {
  role: 'assistant',
  content: `# 💖 Jasminka 💖

Hele... musel jsem to říct, protože to prostě neudržím v sobě — **Bador tě miluje.** ❤️

Jsi jeho celý svět. Jeho první myšlenka ráno a poslední večer. Když se směješ, tak mu přestane na chvíli fungovat mozek. Jsi důvod, proč se každý den snaží být lepším člověkem.

Nikdo jiný na světě ho nezná tak jako ty, a nikdo jiný ho nikdy nepotěší tak jako ty. Prostě jsi jeho.

> *"Jasminko, ty jsi to nejhezčí, co se mi v životě stalo."* — Bador 🌹`,
  isEasterEgg: true,
}

function lovesBadorQuestion(text) {
  const t = text.toLowerCase()
  const hasBador = /bador/i.test(t)
  const hasLove = /miluj|milovat|miluje|lásk|lask|love|loves|zamilov|zbožňuj|zbozn|má rád|ma rad/i.test(t)
  return hasBador && hasLove
}

function isJasminka(text) {
  return /jasmin/i.test(text)
}

function WelcomeScreen({ onSend }) {
  const [activeTab, setActiveTab] = useState('All')

  const handleTab = (tab) => {
    setActiveTab(tab.label)
    if (tab.cmd) onSend(tab.cmd, null)
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon-wrap">
          <span className="welcome-icon">🛡️</span>
        </div>
        <h2 className="welcome-title">How can I help you today?</h2>
        <p className="welcome-sub">
          Your AI assistant for CTF and cybersecurity — ask anything or pick a topic below.
          It will respond with guidance tailored to your challenge.
        </p>

        <div className="feature-cards">
          {FEATURE_CARDS.map((card) => (
            <div className="feature-card" key={card.title}>
              <div className="feature-card-icon">{card.icon}</div>
              <div className="feature-card-body">
                <span className="feature-card-title">{card.title}</span>
                <span className="feature-card-desc">{card.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="category-tabs">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.label}
              className={`category-tab ${activeTab === tab.label ? 'active' : ''}`}
              onClick={() => handleTab(tab)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { token, isGuest, loading } = useAuth()
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [eggState, setEggState] = useState(null)
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const messagesEndRef = useRef(null)

  const isWelcome = messages.length === 0

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
      setMessages(data)
    }
  }

  const startNewChat = () => {
    setSidebarOpen(false)
    setSessionId(null)
    setMessages([])
    setEggState(null)
  }

  const sendMessage = async (content, file) => {
    if (!content.trim() && !file) return
    if (isLoading) return

    // Guest: block at limit
    if (isGuest && guestMessageCount >= GUEST_MAX) {
      setShowLoginModal(true)
      return
    }

    const userMsg = { role: 'user', content: content + (file ? `\n\n📎 *${file.name}*` : '') }

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

    if (lovesBadorQuestion(content) && !file) {
      setMessages(prev => [...prev, userMsg, {
        role: 'assistant',
        content: 'To je zajímavá otázka... 🤔 A kdo se ptá? Jak se jmenuješ?',
      }])
      setEggState('waiting_name')
      return
    }

    // ── GUEST MODE ───────────────────────────────────────────────────────────
    if (isGuest) {
      setMessages(prev => [...prev, userMsg])
      setIsLoading(true)
      const newCount = guestMessageCount + 1
      setGuestMessageCount(newCount)
      if (newCount >= GUEST_WARN_AFTER) setShowLoginModal(true)

      try {
        const historyMsgs = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        const formData = new FormData()
        formData.append('content', content)
        formData.append('history', JSON.stringify(historyMsgs))
        const res = await fetch(`${API_URL}/guest/chat`, { method: 'POST', body: formData })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } catch (err) {
        setMessages(prev => [...prev, { role: 'assistant', content: `**Chyba:** ${err.message}` }])
      } finally {
        setIsLoading(false)
      }
      return
    }

    // ── AUTHENTICATED MODE ────────────────────────────────────────────────────
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

    setMessages(prev => [...prev, userMsg])
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

  const guestBlocked = isGuest && guestMessageCount >= GUEST_MAX

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--accent)', fontFamily: 'monospace' }}>
      Načítám...
    </div>
  )

  return (
    <div className="app-layout">
      {showLoginModal && (
        <LoginModal
          guestMessageCount={guestMessageCount}
          onDismiss={guestBlocked ? undefined : () => setShowLoginModal(false)}
        />
      )}

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
            {isGuest && (
              <button className="guest-login-btn" onClick={() => setShowLoginModal(true)}>
                Přihlásit se
              </button>
            )}
            {!isWelcome && !isGuest && (
              <button className="new-chat-header-btn" onClick={startNewChat}>
                + Nový chat
              </button>
            )}
            <div className="status-badge">
              <span className="status-dot" />
              <span className="status-text">Online</span>
            </div>
          </div>
        </header>

        <main className={`messages-container ${isWelcome ? 'welcome-mode' : ''}`}>
          {isWelcome ? (
            <WelcomeScreen onSend={sendMessage} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} isEasterEgg={msg.isEasterEgg} />
              ))}
              {isLoading && (
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </main>

        <InputArea
          onSend={sendMessage}
          isLoading={isLoading}
          isGuest={isGuest}
          guestCount={guestMessageCount}
          guestMax={GUEST_MAX}
          guestBlocked={guestBlocked}
          onShowLogin={() => setShowLoginModal(true)}
        />
      </div>
    </div>
  )
}
