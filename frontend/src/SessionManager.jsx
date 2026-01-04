import { useState, useEffect } from 'react'
import { Lock, Plus, Eye, EyeOff, RefreshCw } from 'lucide-react'

const KYRIBA = { navy: '#050A12', navyLight: '#0A1220', lime: '#CDFA50', white: '#FFFFFF', gray: '#94A3B8', grayDark: '#1E293B', danger: '#EF4444' }

// API base URL - uses current origin so it works via ngrok
const API_BASE = window.location.origin

export default function SessionManager({ onSessionSelect }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newSessionCode, setNewSessionCode] = useState('')
  const [newSessionName, setNewSessionName] = useState('')
  const [newSessionPassword, setNewSessionPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordPrompt, setPasswordPrompt] = useState(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [error, setError] = useState('')

  // Load sessions from BACKEND on mount
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_BASE + '/api/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        localStorage.setItem('k-light-sessions', JSON.stringify(data))
      } else {
        throw new Error('API error')
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
      const saved = localStorage.getItem('k-light-sessions')
      if (saved) {
        setSessions(JSON.parse(saved))
      }
    } finally {
      setLoading(false)
    }
  }

  const createSession = async () => {
    if (!newSessionCode.trim() || !newSessionName.trim()) {
      setError('Code et nom sont requis')
      return
    }

    if (sessions.find(s => s.code === newSessionCode)) {
      setError('Ce code existe déjà')
      return
    }

    const newSession = {
      code: newSessionCode,
      name: newSessionName,
      password: newSessionPassword || null,
      user_id: 1
    }

    try {
      const res = await fetch(API_BASE + '/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      })

      if (res.ok) {
        const created = await res.json()
        const updated = [...sessions, created]
        setSessions(updated)
        localStorage.setItem('k-light-sessions', JSON.stringify(updated))
        selectSession(created)
      } else {
        const errData = await res.json()
        setError(errData.error || 'Erreur création')
      }
    } catch (err) {
      console.error('Error creating session:', err)
      const localSession = { ...newSession, created_at: new Date().toISOString() }
      const updated = [...sessions, localSession]
      setSessions(updated)
      localStorage.setItem('k-light-sessions', JSON.stringify(updated))
      selectSession(localSession)
    }

    setNewSessionCode('')
    setNewSessionName('')
    setNewSessionPassword('')
    setShowCreate(false)
    setError('')
  }

  const selectSession = async (session) => {
    if (!session) return

    if (typeof session === 'string') {
      session = sessions.find(s => s.code === session)
      if (!session) return
    }

    if (session.password) {
      setPasswordPrompt(session)
      setPasswordInput('')
      setError('')
      return
    }

    localStorage.setItem('k-light-current-session', JSON.stringify(session))
    onSessionSelect(session)
  }

  const verifyPassword = async () => {
    if (!passwordPrompt) return

    try {
      const res = await fetch(API_BASE + '/api/sessions/' + passwordPrompt.code + '/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      })

      if (res.ok) {
        const { session } = await res.json()
        localStorage.setItem('k-light-current-session', JSON.stringify(session))
        onSessionSelect(session)
        setPasswordPrompt(null)
        setPasswordInput('')
        setError('')
      } else {
        setError('Mot de passe incorrect')
      }
    } catch (err) {
      const localSessions = JSON.parse(localStorage.getItem('k-light-sessions') || '[]')
      const localSession = localSessions.find(s => s.code === passwordPrompt.code)
      if (localSession && localSession.password === passwordInput) {
        localStorage.setItem('k-light-current-session', JSON.stringify(localSession))
        onSessionSelect(localSession)
        setPasswordPrompt(null)
        setPasswordInput('')
        setError('')
      } else {
        setError('Mot de passe incorrect')
      }
    }
  }

  const deleteSession = async (code, e) => {
    if (e) e.stopPropagation()
    
    try {
      await fetch(API_BASE + '/api/sessions/' + code, { method: 'DELETE' })
    } catch (err) {
      console.error('Error deleting session:', err)
    }

    const updated = sessions.filter(s => s.code !== code)
    setSessions(updated)
    localStorage.setItem('k-light-sessions', JSON.stringify(updated))
  }

  const loadingSpinnerClass = 'w-4 h-4' + (loading ? ' animate-spin' : '')
  const sessionButtonStyle = { background: KYRIBA.navy, border: '2px solid ' + KYRIBA.lime }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: KYRIBA.navy }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: KYRIBA.lime }}>K-Light</h1>
          <p style={{ color: KYRIBA.gray }}>Gestion des sessions treasury</p>
        </div>

        <div className="rounded-xl p-6 mb-6" style={{ background: KYRIBA.navyLight }}>
          <div className="flex justify-end mb-4">
            <button
              onClick={loadSessions}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-white/10 transition-all"
              title="Rafraîchir les sessions"
            >
              <RefreshCw className={loadingSpinnerClass} style={{ color: KYRIBA.gray }} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: KYRIBA.lime }} />
              <span className="ml-2" style={{ color: KYRIBA.gray }}>Chargement...</span>
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-3 mb-6">
              {sessions.map(session => (
                <button
                  key={session.code}
                  onClick={() => selectSession(session)}
                  className="w-full p-4 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={sessionButtonStyle}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ color: KYRIBA.white }}>{session.name}</div>
                      <div className="text-xs" style={{ color: KYRIBA.gray }}>{session.code}</div>
                      {session.password && (
                        <div className="flex items-center gap-1 mt-1">
                          <Lock className="w-3 h-3" style={{ color: KYRIBA.lime }} />
                          <span className="text-xs" style={{ color: KYRIBA.lime }}>Protégée</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => deleteSession(session.code, e)}
                      className="px-3 py-1 rounded text-xs"
                      style={{ background: KYRIBA.danger, color: KYRIBA.white }}
                    >
                      Supprimer
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p style={{ color: KYRIBA.gray }} className="text-center py-8">Aucune session créée</p>
          )}

          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              style={{ background: KYRIBA.lime, color: KYRIBA.navy }}
            >
              <Plus className="w-4 h-4" />
              Créer une session
            </button>
          ) : (
            <div className="space-y-3 border-t pt-4" style={{ borderColor: KYRIBA.grayDark }}>
              <input
                type="text"
                placeholder="Code de session"
                value={newSessionCode}
                onChange={(e) => setNewSessionCode(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-none outline-none text-sm"
                style={{ background: KYRIBA.navy, color: KYRIBA.white }}
              />
              <input
                type="text"
                placeholder="Nom de la session"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-none outline-none text-sm"
                style={{ background: KYRIBA.navy, color: KYRIBA.white }}
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe (optionnel)"
                  value={newSessionPassword}
                  onChange={(e) => setNewSessionPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-none outline-none text-sm"
                  style={{ background: KYRIBA.navy, color: KYRIBA.white }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" style={{ color: KYRIBA.gray }} />
                  ) : (
                    <Eye className="w-4 h-4" style={{ color: KYRIBA.gray }} />
                  )}
                </button>
              </div>
              {error && <p style={{ color: KYRIBA.danger }} className="text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={createSession}
                  className="flex-1 py-2 rounded-lg font-medium"
                  style={{ background: KYRIBA.lime, color: KYRIBA.navy }}
                >
                  Créer
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false)
                    setError('')
                  }}
                  className="flex-1 py-2 rounded-lg font-medium"
                  style={{ background: KYRIBA.grayDark, color: KYRIBA.white }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {passwordPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl p-6 max-w-sm w-full" style={{ background: KYRIBA.navyLight }}>
            <h3 className="font-medium mb-4" style={{ color: KYRIBA.white }}>
              Cette session est protégée
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
    </div>
  )
}
