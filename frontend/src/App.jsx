import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import HistorySidebar from './components/HistorySidebar';
import LoginModal from './components/LoginModal';
import { AuthContext } from './context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function App() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const maxGuestMessages = 10;
  const remainingGuestMessages = maxGuestMessages - guestMessageCount;

  useEffect(() => {
    const savedSessionId = localStorage.getItem('sessionId');
    const savedUserId = localStorage.getItem('userId');
    const savedAccessToken = localStorage.getItem('accessToken');

    if (savedUserId && savedAccessToken) {
      setIsGuest(false);
      setSessionId(savedSessionId);
    } else {
      setIsGuest(true);
      if (!savedSessionId) {
        const newSessionId = 'session_' + Date.now();
        localStorage.setItem('sessionId', newSessionId);
        setSessionId(newSessionId);
      } else {
        setSessionId(savedSessionId);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close sidebar when clicking outside on mobile
  const handleBackdropClick = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleSendMessage = async (text, file) => {
    if (!text.trim() && !file) return;

    if (isGuest && guestMessageCount >= maxGuestMessages) {
      setShowLoginModal(true);
      return;
    }

    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date(),
      file: file ? { name: file.name, type: file.type } : null,
    };

    setMessages(prev => [...prev, userMessage]);

    if (isGuest) {
      setGuestMessageCount(prev => prev + 1);
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', text);
      if (file) {
        formData.append('file', file);
      }

      let url = '';
      let options = {
        method: 'POST',
        body: formData,
      };

      if (isGuest) {
        url = `${API_BASE_URL}/guest/chat`;
      } else {
        url = `${API_BASE_URL}/sessions/${sessionId}/messages`;
        const accessToken = localStorage.getItem('accessToken');
        options.headers = {
          Authorization: `Bearer ${accessToken}`,
        };
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (data.response) {
        if (
          text.toLowerCase().includes('bador') &&
          text.toLowerCase().includes('love')
        ) {
          const easterEggMessage = {
            id: Date.now() + 1,
            text: '❤️ Ahoj Bado! 🎉\n\nJsem rád, že jsi tady! Tvoje vášeň pro bezpečnost mě inspiruje. Pokud si dál se mnou chceš hrát, jsem tady pro tebe! 💚\n\nMůžeme pokračovat s úkoly CTF?',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, easterEggMessage]);
        } else {
          const botMessage = {
            id: Date.now() + 1,
            text: data.response,
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Omlouváme se, došlo k chybě. Zkuste to prosím znovu.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isGuest, setIsGuest, sessionId, setSessionId }}>
      <div className="app-layout">
        {/* Sidebar */}
        <div className={`sidebar-wrapper${sidebarOpen ? ' open' : ''}`}>
          <HistorySidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile backdrop */}
        <div
          className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
          onClick={handleBackdropClick}
        />

        <div className="app-content">
          {/* Header */}
          <div className="header">
            <button
              className="header-menu-btn"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Menu"
            >
              ☰
            </button>

            <div className="logo">CyberBot</div>

            <div className="header-divider" />
            <span className="header-subtitle-text">CTF & Kybernetická bezpečnost</span>

            <div className="header-actions">
              <div className="status-badge">
                <div className="status-dot" />
                {connectionStatus === 'connected' ? 'Online' : 'Offline'}
              </div>

              {isGuest ? (
                <button
                  className="header-login-btn"
                  onClick={() => setShowLoginModal(true)}
                >
                  Přihlásit se
                </button>
              ) : (
                <button
                  className="header-new-chat-btn"
                  onClick={() => {
                    setMessages([]);
                    setSessionId('session_' + Date.now());
                  }}
                >
                  + Nový chat
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {messages.length === 0 ? (
            <div className="messages-container welcome-mode">
              <div className="welcome-section">
                <div className="welcome-icon">🤖</div>
                <div className="welcome-title">Vítejte v CyberBot</div>
                <div className="welcome-text">
                  Váš asistent pro CTF výzvy a kybernetickou bezpečnost
                </div>
                <div className="feature-cards">
                  <div className="feature-card">
                    <div className="feature-card-icon">⚡</div>
                    <div className="feature-card-title">Rychlé příkazy</div>
                    <div className="feature-card-text">Okamžité odpovědi</div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-card-icon">📁</div>
                    <div className="feature-card-title">Analýza souborů</div>
                    <div className="feature-card-text">Nahrávejte logy a skripty</div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-card-icon">🎯</div>
                    <div className="feature-card-title">CTF Metodologie</div>
                    <div className="feature-card-text">Best practices</div>
                  </div>
                </div>
                <div className="category-tabs">
                  <button className="category-tab active">Recon</button>
                  <button className="category-tab">Web</button>
                  <button className="category-tab">Privesc</button>
                  <button className="category-tab">RevShell</button>
                  <button className="category-tab">Crypto</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-container scrollbar-container">
              {messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <InputArea
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            remainingMessages={remainingGuestMessages}
            onLoginRequest={() => setShowLoginModal(true)}
          />
        </div>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(newSessionId) => {
            setIsGuest(false);
            setSessionId(newSessionId);
            localStorage.setItem('sessionId', newSessionId);
          }}
          messageLimit={remainingGuestMessages <= 0}
        />
      )}
    </AuthContext.Provider>
  );
}

export default App;
