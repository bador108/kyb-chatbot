import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get ID token via userinfo
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json())

        // We need the ID token — use credential flow instead
        // This shouldn't happen with credential flow, fallback
        console.error('Use credential flow')
      } catch (err) {
        console.error(err)
      }
    },
    flow: 'implicit',
  })

  const handleCredential = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential)
      navigate('/')
    } catch (err) {
      alert('Přihlášení selhalo: ' + err.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">{'>'}_</div>
        <h1 className="login-title">CyberBot</h1>
        <p className="login-subtitle">CTF & Kybernetická bezpečnost</p>

        <div className="login-features">
          <div className="feature">
            <span className="feature-icon">⬡</span>
            <span>Analýza nmap, gobuster výstupů</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⬡</span>
            <span>Privilege escalation techniky</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⬡</span>
            <span>Reverse shell & CTF metodologie</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⬡</span>
            <span>Historie chatu uložena k účtu</span>
          </div>
        </div>

        <GoogleLoginButton onSuccess={handleCredential} />

        <p className="login-disclaimer">
          Pouze pro legální cvičná prostředí · TryHackMe · HackTheBox · CTF
        </p>
      </div>
    </div>
  )
}

function GoogleLoginButton({ onSuccess }) {
  return (
    <div className="google-btn-wrapper">
      <div id="google-signin-wrapper">
        <GoogleSignInInner onSuccess={onSuccess} />
      </div>
    </div>
  )
}

import { GoogleLogin } from '@react-oauth/google'

function GoogleSignInInner({ onSuccess }) {
  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={() => alert('Přihlášení selhalo')}
      theme="filled_black"
      shape="rectangular"
      size="large"
      text="signin_with"
      locale="cs"
    />
  )
}
