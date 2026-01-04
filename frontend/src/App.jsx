import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
import SessionManager from './SessionManager'

export default function App() {
  const [currentSession, setCurrentSession] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('k-light-current-session')
    if (saved) {
      try {
        // Parse the saved session object
        const session = JSON.parse(saved)
        if (session && session.name) {
          setCurrentSession(session)
        }
      } catch (e) {
        // Fallback: old format where saved was just a code
        const sessions = JSON.parse(localStorage.getItem('k-light-sessions') || '[]')
        const session = sessions.find(s => s.code === saved || s.name === saved)
        if (session) {
          setCurrentSession(session)
        }
      }
    }
  }, [])

  const handleSessionSelect = (session) => {
    // Save the full session object
    localStorage.setItem('k-light-current-session', JSON.stringify(session))
    setCurrentSession(session)
  }

  if (!currentSession) {
    return <SessionManager onSessionSelect={handleSessionSelect} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard session={currentSession} />} />
        <Route path="/dashboard" element={<Dashboard session={currentSession} />} />
      </Routes>
    </BrowserRouter>
  )
}
