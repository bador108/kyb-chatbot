import { useState, useRef, useEffect } from 'react'
import './InputArea.css'

export default function InputArea({ onSend, isLoading, isGuest, guestCount, guestMax, guestBlocked, onShowLogin }) {
  const [value, setValue] = useState('')
  const [file, setFile] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }, [value])

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  const handleSubmit = () => {
    if (guestBlocked) {
      if (onShowLogin) onShowLogin()
      return
    }
    if ((!value.trim() && !file) || isLoading) return
    onSend(value.trim(), file)
    setValue('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePaste = (e) => {
    if (isGuest) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        const ext = item.type.split('/')[1] || 'png'
        const pastedFile = new File([blob], `screenshot.${ext}`, { type: item.type })
        setFile(pastedFile)
        break
      }
    }
  }

  const remaining = guestMax - (guestCount || 0)
  const showGuestCounter = isGuest && guestCount > 0

  return (
    <div className="input-area">
      {file && (
        <div className="file-preview">
          <span className="file-icon">{file.type.startsWith('image/') ? '🖼' : '📄'}</span>
          <span className="file-name">{file.name}</span>
          <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>
          <button className="file-remove" onClick={removeFile}>×</button>
        </div>
      )}

      <div className="input-box">
        <div className="input-bot-avatar">🛡️</div>
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            guestBlocked
              ? 'Dosáhl jsi limitu zpráv. Přihlas se pro pokračování...'
              : file
              ? 'Přidej komentář k souboru...'
              : 'Type your prompt here...'
          }
          rows={1}
          disabled={isLoading || guestBlocked}
        />
        <div className="input-actions">
          {isGuest ? (
            <label
              className="upload-btn disabled"
              title="Přihlaste se pro nahrávání souborů"
              onClick={onShowLogin}
              style={{ cursor: 'pointer', opacity: 0.35, pointerEvents: 'auto' }}
            >
              📎
            </label>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.log,.md,.py,.js,.php,.sh,.c,.cpp,.h,.json,.xml,.html,.csv,.conf,.cfg,.ini,.env,.sql,.png,.jpg,.jpeg,.gif,.webp,text/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" className={`upload-btn ${isLoading ? 'disabled' : ''}`} title="Nahrát soubor">
                📎
              </label>
            </>
          )}
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={(!value.trim() && !file && !guestBlocked) || isLoading}
          >
            {isLoading ? '⋯' : '↑'}
          </button>
        </div>
      </div>

      {showGuestCounter ? (
        <p className="input-hint guest-counter">
          Zbývá {Math.max(0, remaining)}/{guestMax} zpráv jako host ·{' '}
          <span className="guest-login-link" onClick={onShowLogin}>Přihlásit se</span>
        </p>
      ) : (
        <p className="input-hint">
          CyberBot může dělat chyby. Určeno výlučně pro legální CTF prostředí.
        </p>
      )}
    </div>
  )
}
