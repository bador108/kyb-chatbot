import React, { useEffect, useState, useContext, useRef } from 'react';
import './HistorySidebar.css';
import { AuthContext } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function HistorySidebar({ onClose }) {
  const { isGuest, setIsGuest } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({
    work: true, life: true, projects: true, clients: true,
  });
  const [folderAssignments, setFolderAssignments] = useState({});
  const [showFolderPicker, setShowFolderPicker] = useState(null);
  const pickerRef = useRef(null);

  const folders = [
    { id: 'work',     label: 'Work',     emoji: '💼' },
    { id: 'life',     label: 'Life',     emoji: '🎉' },
    { id: 'projects', label: 'Projects', emoji: '🚀' },
    { id: 'clients',  label: 'Clients',  emoji: '👥' },
  ];

  useEffect(() => {
    if (isGuest) return;
    const fetchSessions = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE_URL}/sessions`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    fetchSessions();

    const saved = localStorage.getItem('folderAssignments');
    if (saved) setFolderAssignments(JSON.parse(saved));
  }, [isGuest]);

  useEffect(() => {
    localStorage.setItem('folderAssignments', JSON.stringify(folderAssignments));
  }, [folderAssignments]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowFolderPicker(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Dnes';
    if (date.toDateString() === yesterday.toDateString()) return 'Včera';
    if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
      return days[date.getDay()];
    }
    return `${date.getDate()}.${date.getMonth() + 1}.`;
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSessions = {
    work:           filteredSessions.filter(s => folderAssignments[s.id] === 'work'),
    life:           filteredSessions.filter(s => folderAssignments[s.id] === 'life'),
    projects:       filteredSessions.filter(s => folderAssignments[s.id] === 'projects'),
    clients:        filteredSessions.filter(s => folderAssignments[s.id] === 'clients'),
    uncategorized:  filteredSessions.filter(s => !folderAssignments[s.id]),
  };

  const SessionItem = ({ session }) => (
    <div className="session-item">
      <div className="session-content">
        <div className="session-title">{session.title}</div>
        <div className="session-date">{formatDate(session.created_at)}</div>
      </div>
      <div className="session-actions">
        <button
          className="session-folder-btn"
          title="Přesunout do složky"
          onClick={(e) => {
            e.stopPropagation();
            setShowFolderPicker(showFolderPicker === session.id ? null : session.id);
          }}
        >
          📁
        </button>
        {showFolderPicker === session.id && (
          <div className="folder-picker" ref={pickerRef}>
            {folders.map(f => (
              <button
                key={f.id}
                className="folder-picker-option"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderAssignments(prev => ({ ...prev, [session.id]: f.id }));
                  setShowFolderPicker(null);
                }}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        )}
        <button
          className="session-delete-btn"
          title="Smazat"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteSession(session.id);
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🤖</div>
          <span>CyberBot</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Zavřít menu">
          ✕
        </button>
      </div>

      {isGuest ? (
        <>
          <button
            className="new-chat-btn"
            onClick={() => window.location.reload()}
          >
            + Nový chat
          </button>
          <div className="sidebar-guest-prompt">
            <p>Přihlas se pro uložení historie chatů a neomezený přístup.</p>
            <button
              className="sidebar-guest-login-btn"
              onClick={() => window.location.href = '/login'}
            >
              Přihlásit se
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            className="new-chat-btn"
            onClick={() => window.location.href = '/'}
          >
            + Nový chat
          </button>

          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <span>🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Hledat chaty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="folders-section scrollbar-container">
            {folders.map(folder => (
              <div key={folder.id} className="folder-item">
                <div className="folder-header" onClick={() => toggleFolder(folder.id)}>
                  <div className="folder-header-content">
                    <span>{folder.emoji} {folder.label}</span>
                  </div>
                  <div className="folder-count">{groupedSessions[folder.id].length}</div>
                  <div className={`folder-toggle${!expandedFolders[folder.id] ? ' collapsed' : ''}`}>▼</div>
                </div>
                <div className={`sessions-list${!expandedFolders[folder.id] ? ' collapsed' : ''}`}>
                  {groupedSessions[folder.id].map(session => (
                    <SessionItem key={session.id} session={session} />
                  ))}
                </div>
              </div>
            ))}

            {groupedSessions.uncategorized.length > 0 && (
              <div className="folder-item">
                <div className="folder-header">
                  <div className="folder-header-content">
                    <span>📌 Ostatní</span>
                  </div>
                  <div className="folder-count">{groupedSessions.uncategorized.length}</div>
                </div>
                <div className="sessions-list">
                  {groupedSessions.uncategorized.map(session => (
                    <SessionItem key={session.id} session={session} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <div className="user-avatar">U</div>
            <div className="user-info">
              <div className="user-name">Uživatel</div>
              <div className="user-email">—</div>
            </div>
            <button className="user-logout-btn" onClick={handleLogout} title="Odhlásit se">
              🚪
            </button>
          </div>
        </>
      )}
    </div>
  );
}
