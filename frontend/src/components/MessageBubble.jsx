import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './MessageBubble.css'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={'message ' + (isUser ? 'user' : 'bot')}>
      {/* Avatar – vlevo pro bota, vpravo pro usera */}
      <div className={'avatar ' + (isUser ? 'user' : 'bot')}>
        {isUser ? '👤' : '🛡️'}
      </div>

      <div className="bubble-body">
        <div className={'bubble ' + (isUser ? 'user' : 'bot')}>
          {isUser ? (
            <span className="user-text">{message.content}</span>
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const lang = match ? match[1] : 'bash'
                    return !inline ? (
                      <div className="code-block-wrapper">
                        <div className="code-block-header">
                          <span className="code-lang">{lang}</span>
                          <button
                            className="copy-btn"
                            onClick={() => navigator.clipboard.writeText(String(children))}
                          >
                            Kopírovat
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={lang}
                          PreTag="div"
                          customStyle={{ margin: 0, borderRadius: '0 0 8px 8px', fontSize: '0.82rem', background: '#0d1117' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="inline-code" {...props}>{children}</code>
                    )
                  },
                  table({ children }) {
                    return <div className="table-wrapper"><table>{children}</table></div>
                  },
                  a({ href, children }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && <span className="streaming-cursor" />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
