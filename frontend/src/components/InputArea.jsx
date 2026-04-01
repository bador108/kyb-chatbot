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
  const textareaRef = useRef(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }, [value])

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return
    onSend(value.trim())
    setValue('')
    textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
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
      <div className="input-row">
        <span className="prompt-symbol">$</span>
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napiš dotaz nebo vlož výstup příkazu... (Enter = odeslat, Shift+Enter = nový řádek)"
          rows={1}
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
        >
          {isLoading ? '...' : '▶'}
        </button>
      </div>
      <p className="input-hint">
        Určeno pro legální CTF a cvičná prostředí · TryHackMe · HackTheBox
      </p>
    </div>
  )
}
