import { useState } from 'react'
import { LogOut, Lock } from 'lucide-react'

const KYRIBA = { navy: '#050A12', navyLight: '#0A1220', lime: '#CDFA50', white: '#FFFFFF', gray: '#94A3B8', grayDark: '#1E293B', danger: '#EF4444' }

export default function SessionSelector({ session, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [passwordPrompt, setPasswordPrompt] = useState(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [error, setError] = useState('')

  const handleChangeSession = () => {
    const sessions = JSON.parse(localStorage.getItem('k-light-sessions') || '[]')
    const otherSessions = sessions.filter(s => s.code !== session.code)
    
    if (otherSessions.length === 0) return

    const targetSession = otherSessions[0]
    
    if (targetSession.password) {
      setPasswordPrompt(targetSession)
      setPasswordInput('')
      setShowDropdown(false)
    } else {
      switchSession(targetSession)
    }
  }

  const switchSession = (newSession) => {
    localStorage.setItem('k-light-current-session', newSession.code)
    window.location.reload()
  }

  const verifyPassword = () => {
    if (passwordPrompt.password === passwordInput) {
      switchSession(passwordPrompt)
    } else {
      setError('Mot de passe incorrect')
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Session Name */}
        <div 
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-3 py-1.5 rounded-lg text-sm cursor-pointer flex items-center gap-2 relative"
          style={{ background: KYRIBA.navy }}
        >
          <span style={{ color: KYRIBA.lime }} className="font-medium">{session.name}</span>
          {session.password && (
            <Lock className="w-3 h-3" style={{ color: KYRIBA.lime }} />
          )}
          
          {/* Dropdown */}
          {showDropdown && (
            <div 
              className="absolute top-full right-0 mt-2 w-48 rounded-lg p-2 z-50"
              style={{ background: KYRIBA.navyLight, border: `1px solid ${KYRIBA.grayDark}` }}
            >
              <button
                onClick={handleChangeSession}
                className="w-full text-left px-3 py-2 rounded text-sm hover:bg-white/10"
                style={{ color: KYRIBA.white }}
              >
                Changer de session
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 rounded text-sm hover:bg-red-500/20 flex items-center gap-2"
                style={{ color: KYRIBA.danger }}
              >
                <LogOut className="w-3 h-3" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password modal */}
      {passwordPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl p-6 max-w-sm w-full" style={{ background: KYRIBA.navyLight }}>
            <h3 className="font-medium mb-4" style={{ color: KYRIBA.white }}>
              Session protégée
            </h3>
            <input
              type="password"
              placeholder="Entrez le mot de passe"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              className="w-full px-4 py-2 rounded-lg border-none outline-none text-sm mb-4"
              style={{ background: KYRIBA.navy, color: KYRIBA.white }}
              autoFocus
            />
            {error && <p style={{ color: KYRIBA.danger }} className="text-sm mb-4">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={verifyPassword}
                className="flex-1 py-2 rounded-lg font-medium"
                style={{ background: KYRIBA.lime, color: KYRIBA.navy }}
              >
                Ouvrir
              </button>
              <button
                onClick={() => {
                  setPasswordPrompt(null)
                  setPasswordInput('')
                  setError('')
                }}
                className="flex-1 py-2 rounded-lg font-medium"
                style={{ background: KYRIBA.grayDark, color: KYRIBA.white }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
