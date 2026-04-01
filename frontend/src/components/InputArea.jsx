import { useState, useRef, useEffect } from 'react'
import './InputArea.css'

const QUICK_COMMANDS = [
  { label: 'nmap scan', text: 'Jak správně použít nmap na CTF?' },
  { label: 'privesc', text: 'Jaké jsou první kroky pro privilege escalation na Linuxu?' },
  { label: 'rev shell', text: 'Jak získat a stabilizovat reverse shell?' },
  { label: 'gobuster', text: 'Ukázkový gobuster příkaz pro web enumeration?' },
]

export default function InputArea({ onSend, isLoading }) {
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

  const handleSubmit = () => {
    if ((!value.trim() && !file) || isLoading) return
    onSend(value.trim(), file)
    setValue('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    textareaRef.current.style.height = 'auto'
    textareaRef.current.focus()
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

  return (
    <div className="input-area">
      <div className="quick-commands">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.label}
            className="quick-cmd-btn"
            onClick={() => { setValue(cmd.text); textareaRef.current?.focus() }}
            disabled={isLoading}
          >
            {cmd.label}
          </button>
        ))}
      </div>

      {file && (
        <div className="file-preview">
          <span className="file-icon">{file.type.startsWith('image/') ? '🖼' : '📄'}</span>
          <span className="file-name">{file.name}</span>
          <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>
          <button className="file-remove" onClick={removeFile}>×</button>
        </div>
      )}

      <div className="input-row">
        <span className="prompt-symbol">$</span>
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={file ? 'Přidej komentář k souboru (nebo odešli přímo)...' : 'Napiš dotaz nebo vlož výstup příkazu...'}
          rows={1}
          disabled={isLoading}
        />
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
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={(!value.trim() && !file) || isLoading}
        >
          {isLoading ? '...' : '▶'}
        </button>
      </div>
      <p className="input-hint">
        Určeno pro legální CTF · podporuje text, logy, obrázky (max 10 MB)
      </p>
    </div>
  )
}
