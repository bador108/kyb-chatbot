import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './HistorySidebar.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export default function HistorySidebar({ currentSessionId, onSelectSession, onNewChat }) {
  const { token, user, logout } = useAuth()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    fetchSessions()
  }, [currentSessionId])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setSessions(await res.json())
    } catch {}
  }

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation()
    await fetch(`${API_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (sessionId === currentSessionId) onNewChat()
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Včera'
    if (diffDays < 7) return d.toLocaleDateString('cs', { weekday: 'short' })
    return d.toLocaleDateString('cs', { day: 'numeric', month: 'short' })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">CyberBot</span>
        <button className="new-chat-btn" onClick={onNewChat} title="Nový chat">+</button>
      </div>

      <div className="sessions-list">
        {sessions.length === 0 && (
          <p className="no-sessions">Zatím žádné chaty</p>
        )}
        {sessions.map(s => (
          <div
            key={s.id}
            className={`session-item ${s.id === currentSessionId ? 'active' : ''}`}
            onClick={() => onSelectSession(s.id)}
          >
            <span className="session-title">{s.title}</span>
            <div className="session-meta">
              <span className="session-date">{formatDate(s.updated_at)}</span>
              <button
                className="delete-session-btn"
                onClick={(e) => deleteSession(e, s.id)}
                title="Smazat"
              >×</button>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <img
          src={user?.picture || ''}
          alt={user?.name}
          className="user-avatar"
          referrerPolicy="no-referrer"
        />
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="user-email">{user?.email}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Odhlásit se">⏻</button>
      </div>
    </aside>
  )
}
