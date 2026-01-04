// ============================================
// USER SESSIONS MANAGEMENT (Vincent, Brigitte, Dora, etc.)
// Add this section after line 22 (after multer setup)
// ============================================

const USER_SESSIONS_FILE = './user-sessions.json';

// Load user sessions from file
function loadUserSessions() {
  try {
    if (fs.existsSync(USER_SESSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(USER_SESSIONS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading user sessions:', e);
  }
  return [];
}

// Save user sessions to file
function saveUserSessions(sessions) {
  fs.writeFileSync(USER_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// ============================================
// USER SESSIONS API ENDPOINTS
// Add these routes after line 244 (after category-rules/reset)
// ============================================

// GET /api/sessions - List all user sessions
app.get('/api/sessions', (req, res) => {
  const sessions = loadUserSessions();
  // Don't send passwords to frontend
  const safeSessions = sessions.map(s => ({
    ...s,
    password: s.password ? true : null // Just indicate if password exists
  }));
  res.json(safeSessions);
});

// POST /api/sessions - Create a new user session
app.post('/api/sessions', (req, res) => {
  const { code, name, password, user_id } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ error: 'code and name are required' });
  }
  
  const sessions = loadUserSessions();
  
  // Check if code already exists
  if (sessions.find(s => s.code === code)) {
    return res.status(409).json({ error: 'Session code already exists' });
  }
  
  const newSession = {
    code,
    name,
    password: password || null,
    user_id: user_id || 1,
    created_at: new Date().toISOString()
  };
  
  sessions.push(newSession);
  saveUserSessions(sessions);
  
  // Return without password
  res.json({
    ...newSession,
    password: newSession.password ? true : null
  });
});

// GET /api/sessions/:code - Get a specific session
app.get('/api/sessions/:code', (req, res) => {
  const { code } = req.params;
  const sessions = loadUserSessions();
  const session = sessions.find(s => s.code === code);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    ...session,
    password: session.password ? true : null
  });
});

// POST /api/sessions/:code/verify - Verify password for a session
app.post('/api/sessions/:code/verify', (req, res) => {
  const { code } = req.params;
  const { password } = req.body;
  
  const sessions = loadUserSessions();
  const session = sessions.find(s => s.code === code);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  if (!session.password) {
    // No password required
    return res.json({ success: true, session: { ...session, password: null } });
  }
  
  if (session.password === password) {
    return res.json({ success: true, session: { ...session, password: true } });
  }
  
  res.status(401).json({ error: 'Invalid password' });
});

// DELETE /api/sessions/:code - Delete a user session
app.delete('/api/sessions/:code', (req, res) => {
  const { code } = req.params;
  const sessions = loadUserSessions();
  const index = sessions.findIndex(s => s.code === code);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  sessions.splice(index, 1);
  saveUserSessions(sessions);
  
  res.json({ success: true });
});

// PUT /api/sessions/:code - Update a user session
app.put('/api/sessions/:code', (req, res) => {
  const { code } = req.params;
  const { name, password, user_id } = req.body;
  
  const sessions = loadUserSessions();
  const index = sessions.findIndex(s => s.code === code);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  if (name) sessions[index].name = name;
  if (password !== undefined) sessions[index].password = password || null;
  if (user_id) sessions[index].user_id = user_id;
  
  saveUserSessions(sessions);
  
  res.json({
    ...sessions[index],
    password: sessions[index].password ? true : null
  });
});
