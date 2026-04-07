import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import HistorySidebar from './components/HistorySidebar';
import LoginModal from './components/LoginModal';
import { useAuth } from './context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORY_PROMPTS = {
  Recon:    'Jaké jsou základní kroky recon fáze v CTF? Vysvětli nmap a gobuster.',
  Web:      'Jaké jsou nejčastější web zranitelnosti v CTF? (SQLi, XSS, LFI...)',
  Privesc:  'Jak provést privilege escalation na Linuxu? Jaké nástroje použít?',
  RevShell: 'Ukaž mi příklady reverse shell příkazů pro různé jazyky.',
  Crypto:   'Jaké jsou základní kryptografické útoky v CTF? (Caesar, RSA, hash...)',
};

const FEATURE_PROMPTS = {
  quick:  'Jaké jsou nejdůležitější příkazy pro CTF? Dej mi rychlý přehled.',
  files:  'Jak analyzovat podezřelý soubor v CTF? Co hledat?',
  method: 'Popiš CTF metodologii od začátku do konce.',
};

function App() {
  const { isGuest, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Recon');
  const messagesEndRef = useRef(null);
  const maxGuestMessages = 10;

  // When authenticated, fetch or create a backend session
  useEffect(() => {
    if (isGuest || !token) return;
    const initSession = async () => {
      try {
        // Try to get existing sessions
        const res = await fetch(API_BASE_URL + '/sessions', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (res.ok) {
          const sessions = await res.json();
          if (sessions.length > 0) {
            setSessionId(sessions[0].id);
            return;
          }
        }
        // No sessions yet — create one
        const createRes = await fetch(API_BASE_URL + '/sessions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Nový chat' }),
        });
        if (createRes.ok) {
          const session = await createRes.json();
          setSessionId(session.id);
        }
      } catch (err) {
        console.error('Session init error:', err);
      }
    };
    initSession();
  }, [isGuest, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleBackdropClick = useCallback(() => setSidebarOpen(false), []);

  const handleSendMessage = async (text, file) => {
    if (!text.trim() && !file) return;
    if (isGuest && guestMessageCount >= maxGuestMessages) {
      setShowLoginModal(true);
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      file: file ? { name: file.name, type: file.type } : null,
    };
    setMessages(prev => [...prev, userMessage]);
    if (isGuest) setGuestMessageCount(prev => prev + 1);
    setIsLoading(true);

    try {
      const formData = new FormData();
      // Backend expects "content" field (not "message")
      formData.append('content', text);
      if (file) formData.append('file', file);

      let url;
      const options = { method: 'POST', body: formData };

      if (isGuest) {
        url = API_BASE_URL + '/guest/chat';
      } else {
        // If no sessionId yet, create one inline
        let sid = sessionId;
        if (!sid) {
          const createRes = await fetch(API_BASE_URL + '/sessions', {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: text.slice(0, 50) }),
          });
          if (createRes.ok) {
            const session = await createRes.json();
            sid = session.id;
            setSessionId(sid);
          }
        }
        url = API_BASE_URL + '/sessions/' + sid + '/messages';
        options.headers = { Authorization: 'Bearer ' + token };
      }

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error('Server responded with ' + response.status);
      }
      const data = await response.json();

      if (data.response) {
        const isEasterEgg = text.toLowerCase().includes('bador') && text.toLowerCase().includes('love');
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: isEasterEgg
            ? 'Ahoj Bado! ❤️ Jsem rád, že jsi tady! Tvoje vášeň pro bezpečnost mě inspiruje.'
            : data.response,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Chyba při odeslání zprávy: ' + error.message + '. Zkuste obnovit stránku.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (text) => handleSendMessage(text, null);

  const handleNewChat = async () => {
    setMessages([]);
    if (!isGuest && token) {
      try {
        const createRes = await fetch(API_BASE_URL + '/sessions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Nový chat' }),
        });
        if (createRes.ok) {
          const session = await createRes.json();
          setSessionId(session.id);
        }
      } catch (err) {
        console.error('New session error:', err);
      }
    }
  };

  return (
    <div className="app-layout">
      <div className={`sidebar-wrapper${sidebarOpen ? ' open' : ''}`}>
        <HistorySidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
        onClick={handleBackdropClick}
      />
      <div className="app-content">
        <div className="header">
          <button
            className="header-menu-btn"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Menu"
          >
            &#9776;
          </button>
          <div className="logo">CyberBot</div>
          <div className="header-divider" />
          <span className="header-subtitle-text">CTF & Kybernetická bezpečnost</span>
          <div className="header-actions">
            <div className="status-badge">
              <div className="status-dot" />
              Online
            </div>
            {isGuest ? (
              <button className="header-login-btn" onClick={() => setShowLoginModal(true)}>
                Přihlásit se
              </button>
            ) : (
              <button className="header-new-chat-btn" onClick={handleNewChat}>
                + Nový chat
              </button>
            )}
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="messages-container welcome-mode">
            <div className="welcome-section">
              <div className="welcome-icon">🤖</div>
              <div className="welcome-title">Vítejte v CyberBot</div>
              <div className="welcome-text">
                Váš asistent pro CTF výzvy a kybernetickou bezpečnost
              </div>
              <div className="feature-cards">
                <div className="feature-card" onClick={() => handleQuickPrompt(FEATURE_PROMPTS.quick)}>
                  <div className="feature-card-icon">⚡</div>
                  <div className="feature-card-title">Rychlé příkazy</div>
                  <div className="feature-card-text">Okamžité odpovědi</div>
                </div>
                <div className="feature-card" onClick={() => handleQuickPrompt(FEATURE_PROMPTS.files)}>
                  <div className="feature-card-icon">📁</div>
                  <div className="feature-card-title">Analýza souborů</div>
                  <div className="feature-card-text">Nahrávejte logy a skripty</div>
                </div>
                <div className="feature-card" onClick={() => handleQuickPrompt(FEATURE_PROMPTS.method)}>
                  <div className="feature-card-icon">🎯</div>
                  <div className="feature-card-title">CTF Metodologie</div>
                  <div className="feature-card-text">Best practices</div>
                </div>
              </div>
              <div className="category-tabs">
                {Object.keys(CATEGORY_PROMPTS).map(tab => (
                  <button
                    key={tab}
                    className={`category-tab${activeTab === tab ? ' active' : ''}`}
                    onClick={() => { setActiveTab(tab); handleQuickPrompt(CATEGORY_PROMPTS[tab]); }}
                  >
                    {tab}
                  </button>
                ))}
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
          remainingMessages={maxGuestMessages - guestMessageCount}
          onLoginRequest={() => setShowLoginModal(true)}
        />
      </div>

      {showLoginModal && (
        <LoginModal
          guestMessageCount={guestMessageCount}
          onDismiss={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default App;
