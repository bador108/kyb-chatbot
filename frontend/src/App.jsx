import { useState, useRef, useEffect } from 'react'
import MessageBubble from './components/MessageBubble'
import InputArea from './components/InputArea'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || ''

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `# CyberBot - CTF & Kybernetická bezpečnost

Vítej! Jsem tvůj AI asistent specializovaný na CTF soutěže a kybernetickou bezpečnost.

**Co umím:**
- Analyzovat výstupy nástrojů (nmap, gobuster, netcat...)
- Pomoci s privilege escalation
- Vysvětlit reverse shell techniky
- Poradit s CTF metodologií
- Odpovídat na otázky o kybernetické bezpečnosti

**Příklady dotazů:**
- *Pošli mi výstup nmap a analyzuji ho*
- *Jak eskaluji práva na Linuxu?*
- *Jaké gobuster příkazy použít na web?*
- *Jak stabilizovat reverse shell?*

> Pomáhám výhradně s legálními cvičnými prostředími (TryHackMe, HackTheBox, CTF).`
}

export default function App() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return

    const userMessage = { role: 'user', content }
    const newMessages = [...messages.filter(m => m !== WELCOME_MESSAGE || messages.length > 1), userMessage]

    // Keep welcome only if it's the only message, otherwise drop it from API call
    const apiMessages = messages
      .filter(m => m !== WELCOME_MESSAGE)
      .concat(userMessage)

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Chyba připojení k API:** ${err.message}\n\nZkontroluj že backend běží a proměnná \`VITE_API_URL\` je správně nastavena.`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE])
  }

  return (
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
          <button className="clear-btn" onClick={clearChat} title="Vymazat chat">
            ⌫ Vymazat
          </button>
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
  )
}
