import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import './HistorySidebar.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
const FOLDERS = ['Work chats', 'Life chats', 'Projects chats', 'Clients chats']
const LS_KEY = 'kyb_chat_folders'

function getFolderAssignments() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function saveFolderAssignment(sessionId, folderName) {
  const a = getFolderAssignments()
  if (folderName === null) delete a[sessionId]
  else a[sessionId] = folderName
  localStorage.setItem(LS_KEY, JSON.stringify(a))
}

export default function HistorySidebar({ currentSessionId, onSelectSession, onNewChat }) {
  const { token, user, logout, isGuest, loading } = useAuth()
  const [sessions, setSessions] = useState([])
  const [search, setSearch] = useState('')
  const [openFolders, setOpenFolders] = useState({})
  const [folderAssignments, setFolderAssignments] = useState({})
  const [folderPickerOpen, setFolderPickerOpen] = useState(null)
  const pickerRef = useRef(null)

  useEffect(() => { setFolderAssignments(getFolderAssignments()) }, [])

  useEffect(() => {
    if (!loading && !isGuest && token) fetchSessions()
  }, [currentSessionId, isGuest, loading, token])

  useEffect(() => {
    if (!folderPickerOpen) return
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setFolderPickerOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [folderPickerOpen])

  const fetchSessions = async () => {
    try {
      const res = await fetch(API_URL + '/sessions', { headers: { Authorization: 'Bearer ' + token } })
      if (res.ok) setSessions(await res.json())
    } catch {}
  }

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation()
    await fetch(API_URL + '/sessions/' + sessionId, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (sessionId === currentSessionId) onNewChat()
  }

  const formatDate = (iso) => {
    const d = new Date(iso), now = new Date()
    const diff = Math.floor((now - d) / 86400000)
    if (diff === 0) return d.toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })
    if (diff === 1) return 'Vcera'
    if (diff < 7) return d.toLocaleDateString('cs', { weekday: 'short' })
    return d.toLocaleDateString('cs', { day: 'numeric', month: 'short' })
  }

  const toggleFolder = (name) => setOpenFolders(prev => ({ ...prev, [name]: !prev[name] }))

  const openPicker = (e, sessionId) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setFolderPickerOpen({ sessionId, x: rect.right, y: rect.bottom })
  }

  const assignFolder = (sessionId, folderName) => {
    saveFolderAssignment(sessionId, folderName)
    setFolderAssignments(getFolderAssignments())
    setFolderPickerOpen(null)
  }

  const filtered = sessions.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()))
  const sessionsByFolder = {}
  FOLDERS.forEach(f => { sessionsByFolder[f] = [] })
  const unfoldered = []
  filtered.forEach(s => {
    const folder = folderAssignments[s.id]
    if (folder && FOLDERS.includes(folder)) sessionsByFolder[folder].push(s)
    else unfoldered.push(s)
  })

  const renderSession = (s, inFolder) => (
    <div
      key={s.id}
      className={`session-item ${s.id === currentSessionId ? 'active' : ''} ${inFolder ? 'in-folder' : ''}`}
      onClick={() => onSelectSession(s.id)}
    >
      <span className="session-icon">💬</span>
      <div className="session-content">
        <span className="session-title">{s.title}</span>
        <span className="session-date">{formatDate(s.updated_at)}</span>
      </div>
      <button className="folder-assign-btn" onClick={(e) => openPicker(e, s.id)} title="Přiřadit do složky">📁</button>
      <button className="delete-session-btn" onClick={(e) => deleteSession(e, s.id)} title="Smazat">×</button>
    </div>
  )

  if (isGuest) {
    return (
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🛡️</div>
            <span>My Chats</span>
          </div>
        </div>
        <div className="sidebar-guest-msg">
          <p>Přihlas se pro ukládání chatů a složky.</p>
        </div>
        <div className="sidebar-bottom">
          <button className="new-chat-btn" onClick={onNewChat}>
            <span className="new-chat-plus">+</span>
            New chat
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🛡️</div>
          <span>My Chats</span>
        </div>
        <button className="sidebar-menu-btn" title="Menu">⋯</button>
      </div>

      <div className="sidebar-search-wrap">
        <span className="sidebar-search-icon">🔍</span>
        <input
          className="sidebar-search"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {!search && (
        <div className="folders-section">
          <div className="sidebar-section-label">Folders</div>
          {FOLDERS.map(folder => {
            const folderSessions = sessionsByFolder[folder]
            const hasItems = folderSessions.length > 0
            const isOpen = openFolders[folder] !== undefined ? openFolders[folder] : hasItems
            return (
              <div key={folder}>
                <div className="folder-item" onClick={() => toggleFolder(folder)}>
                  <span className="folder-icon">{isOpen ? '📂' : '📁'}</span>
                  <span className="folder-name">{folder}</span>
                  {hasItems && <span className="folder-count">{folderSessions.length}</span>}
                  <span className="folder-chevron">{isOpen ? '▾' : '▸'}</span>
                </div>
                {isOpen && hasItems && (
                  <div className="folder-sessions">
                    {folderSessions.map(s => renderSession(s, true))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="sessions-list">
        {unfoldered.length > 0 && <div className="sidebar-section-label">Chats</div>}
        {unfoldered.length === 0 && !search && sessions.length === 0 && (
          <p className="no-sessions">Zatím žádné chaty.<br/>Začni nový dotaz!</p>
        )}
        {unfoldered.length === 0 && search && (
          <p className="no-sessions">Žádné výsledky pro<br/>"{search}"</p>
        )}
        {unfoldered.map(s => renderSession(s, false))}
      </div>

      <div className="sidebar-bottom">
        <button className="new-chat-btn" onClick={onNewChat}>
          <span className="new-chat-plus">+</span>
          New chat
        </button>
      </div>

      <div className="sidebar-footer">
        <img src={user?.picture || ''} alt={user?.name} className="user-avatar" referrerPolicy="no-referrer" />
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="user-email">{user?.email}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Odhlásit se">⏻</button>
      </div>

      {folderPickerOpen && (
        <div
          ref={pickerRef}
          className="folder-picker"
          style={{
            top: folderPickerOpen.y + 4,
            left: Math.min(folderPickerOpen.x - 160, window.innerWidth - 170),
          }}
        >
          {FOLDERS.map(f => (
            <button
              key={f}
              className={`folder-picker-item ${folderAssignments[folderPickerOpen.sessionId] === f ? 'selected' : ''}`}
              onClick={() => assignFolder(folderPickerOpen.sessionId, f)}
            >
              📁 {f}
            </button>
          ))}
          <div className="folder-picker-divider" />
          <button
            className="folder-picker-item folder-picker-remove"
            onClick={() => assignFolder(folderPickerOpen.sessionId, null)}
          >
            ✕ Bez složky
          </button>
        </div>
      )}
    </aside>
  )
}
