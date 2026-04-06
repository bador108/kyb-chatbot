import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './LoginModal.css'

const GUEST_MAX = 10

const LOGGED_IN_PERKS = [
  'Historie chatů uložena',
  'Nahrávání souborů a obrázků',
  'Organizace chatů do složek',
  'Neomezený počet zpráv',
  'Synchronizace mezi zařízeními',
]

const GUEST_LIMITS = [
  'Historie se smaže po zavření',
  'Nelze nahrávat soubory',
  'Max 10 zpráv za sezení',
  'Žádné složky',
]

export default function LoginModal({ guestMessageCount = 0, onDismiss }) {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const isBlocked = guestMessageCount >= GUEST_MAX
  const remaining = Math.max(0, GUEST_MAX - guestMessageCount)

  const handleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential)
      onDismiss?.()
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <div className="login-modal-overlay" onClick={isBlocked ? undefined : onDismiss}>
      <div className="login-modal-card" onClick={e => e.stopPropagation()}>
        <div className="login-modal-header">
          <div className="login-modal-icon">🔓</div>
          <h2 className="login-modal-title">Získej plný přístup</h2>
          <p className="login-modal-sub">
            {isBlocked
              ? 'Dosáhl jsi limitu zpráv jako host. Přihlas se pro pokračování.'
              : 'Přihlas se a odemkni všechny funkce CyberBota.'}
          </p>
        </div>

        <div className="login-modal-perks">
          <div className="perks-col">
            <div className="perks-col-title perks-col-good">Přihlášený uživatel</div>
            {LOGGED_IN_PERKS.map(p => (
              <div key={p} className="perk-item perk-good">
                <span className="perk-icon">✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
          <div className="perks-col">
            <div className="perks-col-title perks-col-bad">Host</div>
            {GUEST_LIMITS.map(p => (
              <div key={p} className="perk-item perk-bad">
                <span className="perk-icon">✗</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="login-modal-actions">
          <div className="google-btn-wrap">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => alert('Přihlášení selhalo')}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="signin_with"
              locale="cs"
            />
          </div>

          {!isBlocked && (
            <button className="dismiss-btn" onClick={onDismiss}>
              Pokračovat jako host (zbývá {remaining} zpráv)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
