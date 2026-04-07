import React, { useEffect, useRef } from 'react';
import './InputArea.css';
import { useAuth } from '../context/AuthContext';

const ACCEPTED_FORMATS = ['.py', '.js', '.php', '.sql', '.txt', '.md', '.json', '.xml', '.png', '.jpg', '.gif', '.webp'];

export default function InputArea({ onSendMessage, isLoading, remainingMessages, onLoginRequest }) {
  const [message, setMessage] = React.useState('');
  const [file, setFile] = React.useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isGuest } = useAuth();

  const maxGuestMessages = 10;
  const isGuestBlocked = isGuest && remainingMessages <= 0;
  const canUpload = !isGuest;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [message]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (message.trim() || file) {
      onSendMessage(message, file);
      setMessage('');
      setFile(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
      if (ACCEPTED_FORMATS.includes(ext)) {
        setFile(selectedFile);
      } else {
        alert('Nepodporovaný formát souboru');
      }
    }
  };

  const handlePaste = (e) => {
    if (!canUpload || isGuestBlocked) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (let item of items) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f && f.type.startsWith('image/')) { setFile(f); break; }
        }
      }
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return { py:'🐍', js:'⚙️', php:'🐘', sql:'📊', txt:'📄', md:'📝', json:'{}', xml:'<>',
             png:'🖼️', jpg:'🖼️', gif:'🎬', webp:'🖼️' }[ext] || '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const placeholderText = isGuestBlocked
    ? 'Dosáhl jsi limitu — přihlas se pro pokračování'
    : file
      ? 'Přidej komentář k souboru...'
      : 'Napiš zprávu... (Enter = odeslat, Shift+Enter = nový řádek)';

  return (
    <div className="input-area">
      {file && (
        <div className="file-preview">
          <div className="file-preview-icon">{getFileIcon(file.name)}</div>
          <div className="file-preview-info">
            <div className="file-preview-name">{file.name}</div>
            <div className="file-preview-size">{formatFileSize(file.size)}</div>
          </div>
          <button className="file-preview-remove" onClick={() => setFile(null)}>✕</button>
        </div>
      )}
      <div className={'input-box' + (isGuestBlocked || isLoading ? ' disabled' : '')}>
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canUpload || isGuestBlocked || isLoading}
          title={!canUpload ? 'Přihlaste se pro nahrávání souborů' : 'Nahrát soubor'}
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={ACCEPTED_FORMATS.join(',')}
          style={{ display: 'none' }}
        />
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholderText}
          disabled={isGuestBlocked || isLoading}
          rows="1"
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && !file) || isGuestBlocked}
          aria-label="Odeslat"
        >
          {isLoading ? '…' : '↑'}
        </button>
      </div>
      {isGuest && !isGuestBlocked && (
        <div className="input-hint">
          Zbývá {remainingMessages}/{maxGuestMessages} zpráv ·{' '}
          <button className="guest-limit-btn" onClick={onLoginRequest}>
            Přihlásit se pro neomezený přístup
          </button>
        </div>
      )}
    </div>
  );
}
