import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { 
  initializeSession, 
  getSession, 
  getUserData,
  getUserAccounts,
  getUserTransactions,
  getStats,
  reloadSession
} from './session-manager.js';

dotenv.config();

const app = express();
const PORT = 8080;
const DB_FILE = './data.json';
const upload = multer({ storage: multer.memoryStorage() });

// BASE_URL for redirects - use ngrok URL when running remotely
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
console.log('🌐 BASE_URL:', BASE_URL);
console.log('🌐 API_BASE_URL:', API_BASE_URL);

// ============================================
// USER SESSIONS MANAGEMENT (Vincent, Brigitte, Dora, etc.)
// ============================================
const USER_SESSIONS_FILE = './user-sessions.json';

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

function saveUserSessions(sessions) {
  fs.writeFileSync(USER_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// PDF text extraction - multiple methods for robustness
async function extractPdfText(buffer) {
  // Method 1: Try pdf-parse first (most reliable)
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    if (data.text && data.text.length > 10) {
      console.log('    PDF parsed with pdf-parse');
      return data.text;
    }
  } catch (e) {
    console.log('    pdf-parse failed:', e.message);
  }

  // Method 2: Try pdfreader as fallback
  try {
    const { PdfReader } = await import('pdfreader');
    return new Promise((resolve) => {
      const textItems = [];
      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) { 
          console.log('    pdfreader error:', err.message);
          resolve(''); 
          return; 
        }
        if (!item) { 
          console.log('    pdfreader extracted:', textItems.length, 'items');
          resolve(textItems.join(' ')); 
          return; 
        }
        if (item.text) textItems.push(item.text);
      });
    });
  } catch (e) {
    console.log('    pdfreader failed:', e.message);
  }

  return '';
}

app.use(cors());
app.use(express.json());

// ============================================
// SESSION MANAGER INITIALIZATION
// ============================================
initializeSession();

// ============================================
// USER SESSIONS API ENDPOINTS
// ============================================

// GET /api/sessions - List all user sessions
app.get('/api/sessions', (req, res) => {
  const sessions = loadUserSessions();
  const safeSessions = sessions.map(s => ({
    ...s,
    password: s.password ? true : null
  }));
  res.json(safeSessions);
});

// POST /api/sessions - Create a new user session
app.post('/api/sessions', (req, res) => {
  const { code, name, password, user_id } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'code and name required' });
  }
  const sessions = loadUserSessions();
  if (sessions.find(s => s.code === code)) {
    return res.status(409).json({ error: 'Code already exists' });
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
  res.json({ ...newSession, password: newSession.password ? true : null });
});

// POST /api/sessions/:code/verify - Verify password for a session
app.post('/api/sessions/:code/verify', (req, res) => {
  const { code } = req.params;
  const { password } = req.body;
  const sessions = loadUserSessions();
  const session = sessions.find(s => s.code === code);
  if (!session) return res.status(404).json({ error: 'Not found' });
  if (!session.password || session.password === password) {
    return res.json({ success: true, session: { ...session, password: session.password ? true : null } });
  }
  res.status(401).json({ error: 'Invalid password' });
});

// DELETE /api/sessions/:code - Delete a user session
app.delete('/api/sessions/:code', (req, res) => {
  const { code } = req.params;
  let sessions = loadUserSessions();
  sessions = sessions.filter(s => s.code !== code);
  saveUserSessions(sessions);
  res.json({ success: true });
});

// ============================================
// AUTO-CATEGORIZATION RULES (Per Session)
// ============================================
const DEFAULT_RULES = [
  { id: 1, keywords: ['mcdo', 'mcdonald', 'burger', 'pizza', 'restaurant', 'cafe', 'coffee', 'starbucks', 'kfc', 'oriental soup', 'apricot coffee', 'la praline', 'culinaris'], category: '🍔 Restauration' },
  { id: 2, keywords: ['alloresto', 'deliveroo', 'ubereats', 'just eat', 'foodora', 'wolt', 'kifli'], category: '🛵 Livraison/Courses' },
  { id: 3, keywords: ['franprix', 'monoprix', 'carrefour', 'auchan', 'leclerc', 'lidl', 'aldi', 'casino', 'spar', 'coop', 'rossmann', 'dm-drogerie', 'drogerie'], category: '🛒 Courses' },
  { id: 4, keywords: ['sncf', 'train', 'tgv', 'eurostar', 'mav', 'gls hungary'], category: '🚄 Train/Livraison' },
  { id: 5, keywords: ['uber', 'bolt', 'taxi', 'vtc', 'lyft'], category: '🚕 Taxi/VTC' },
  { id: 6, keywords: ['ratp', 'metro', 'bus', 'navigo', 'bkk', 'bkv'], category: '🚇 Transport' },
  { id: 7, keywords: ['wizzair', 'ryanair', 'easyjet', 'lufthansa', 'air france', 'flight', 'airline'], category: '✈️ Avion' },
  { id: 8, keywords: ['amazon', 'aliexpress', 'ebay'], category: '📦 E-commerce' },
  { id: 9, keywords: ['netflix', 'spotify', 'disney', 'hbo', 'apple', 'youtube', 'playstation', 'xbox', 'nintendo'], category: '🎬 Streaming/Jeux' },
  { id: 10, keywords: ['google', 'microsoft', 'adobe', 'dropbox', 'budgea', 'nickel'], category: '☁️ Services' },
  { id: 11, keywords: ['pharmacie', 'pharmacy', 'docteur', 'doctor', 'medical', 'hospital'], category: '💊 Santé' },
  { id: 12, keywords: ['gym', 'fitness', 'sport', 'life1', 'basic fit'], category: '🏋️ Sport' },
  { id: 13, keywords: ['bar', 'pub', 'beer', 'biere', 'bootlagers', "hall's", 'három tarka', 'béry'], category: '🍺 Bars/Cafés' },
  { id: 14, keywords: ['virement', 'transfer', 'wise', 'revolut', 'moved', 'sent', 'received'], category: '💸 Virements' },
  { id: 15, keywords: ['salaire', 'salary', 'paie', 'vdonomics', 'consulting'], category: '💰 Revenus' },
  { id: 16, keywords: ['loyer', 'rent', 'landlord', 'pozsonyi'], category: '🏠 Loyer' },
  { id: 17, keywords: ['withdrawn', 'retrait', 'dab', 'atm', 'cash'], category: '💵 Retrait' },
  { id: 18, keywords: ['lurkobebi', 'barion', 'creche', 'ecole', 'school'], category: '👶 Enfants' },
  { id: 19, keywords: ['airbnb', 'booking', 'hotel'], category: '🏨 Hébergement' },
  { id: 20, keywords: ['lui rakpart'], category: '🍺 Bars/Cafés' },
  { id: 21, keywords: ['flora mini', 'delice', 'stuhmer'], category: '🛒 Courses' },
];

// Session-based rules storage in data.json
function loadCategoryRules(sessionId) {
  const db = loadDb();
  if (!db.categoryRules) db.categoryRules = {};
  return db.categoryRules[sessionId || '_default'] || DEFAULT_RULES;
}

function saveCategoryRules(rules, sessionId) {
  const db = loadDb();
  if (!db.categoryRules) db.categoryRules = {};
  db.categoryRules[sessionId || '_default'] = rules;
  saveDb(db);
}

// Helper to categorize with session-specific rules
function categorizeTransactionWithSession(description, sessionId) {
  const rules = loadCategoryRules(sessionId);
  const desc = (description || '').toLowerCase();
  for (const rule of rules) {
    for (const kw of rule.keywords || []) {
      if (desc.includes(kw.toLowerCase())) {
        return rule.category;
      }
    }
  }
  return '❓ Autre';
}

// ============================================
// FORECASTS STORAGE (Per Session)
// ============================================
function loadForecasts(sessionId) {
  const db = loadDb();
  if (!db.forecasts) db.forecasts = {};
  return db.forecasts[sessionId || '_default'] || [];
}

function saveForecasts(forecasts, sessionId) {
  const db = loadDb();
  if (!db.forecasts) db.forecasts = {};
  db.forecasts[sessionId || '_default'] = forecasts;
  saveDb(db);
}

function getUserForecasts(userId, sessionId) {
  return loadForecasts(sessionId);
}

function setUserForecasts(userId, forecasts, sessionId) {
  saveForecasts(forecasts, sessionId);
}

// Global categorize function uses default rules (for backward compat)
function categorizeTransaction(description) {
  if (!description) return '❓ Autre';
  const desc = description.toLowerCase();
  
  for (const rule of DEFAULT_RULES) {
    for (const keyword of rule.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }
  
  if (desc.includes('pending')) return '⏳ En attente';
  if (desc.includes('converted') || desc.includes('moved')) return '💱 Change';
  
  return '❓ Autre';
}

// ============================================
// CATEGORIZATION API ENDPOINTS
// ============================================

// Get rules for a session
app.get('/api/category-rules', (req, res) => {
  const { sessionId } = req.query;
  const rules = loadCategoryRules(sessionId);
  res.json({ rules });
});

// Add a new rule to a session
app.post('/api/category-rules', (req, res) => {
  const { keywords, category, sessionId } = req.body;
  if (!keywords || !category) {
    return res.status(400).json({ error: 'keywords and category required' });
  }
  const rules = loadCategoryRules(sessionId);
  const newRule = {
    id: Date.now(),
    keywords: Array.isArray(keywords) ? keywords : keywords.split(',').map(k => k.trim().toLowerCase()),
    category
  };
  rules.push(newRule);
  saveCategoryRules(rules, sessionId);
  res.json({ rule: newRule, rules });
});

// Update a rule in a session
app.put('/api/category-rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { keywords, category, sessionId } = req.body;
  const rules = loadCategoryRules(sessionId);
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  if (keywords) {
    rules[index].keywords = Array.isArray(keywords) ? keywords.map(k => k.toLowerCase()) : keywords.split(',').map(k => k.trim().toLowerCase());
  }
  if (category) {
    rules[index].category = category;
  }
  saveCategoryRules(rules, sessionId);
  res.json({ rule: rules[index], rules });
});

// Delete a rule from a session
app.delete('/api/category-rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { sessionId } = req.query;
  const rules = loadCategoryRules(sessionId);
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  rules.splice(index, 1);
  saveCategoryRules(rules, sessionId);
  res.json({ success: true, rules });
});

// Reset to default rules for a session
app.post('/api/category-rules/reset', (req, res) => {
  const { sessionId } = req.body;
  const rules = [...DEFAULT_RULES];
  saveCategoryRules(rules, sessionId);
  res.json({ rules });
});

// ============================================
// API: USER FORECASTS (Manual & Imported) - Per Session
// ============================================

// Get all forecasts for a session
app.get('/api/forecasts/:userId', (req, res) => {
  const { userId } = req.params;
  const { sessionId } = req.query;
  const forecasts = getUserForecasts(userId, sessionId);
  res.json({ forecasts });
});

// Save/replace all forecasts for a session
app.post('/api/forecasts/:userId', (req, res) => {
  const { userId } = req.params;
  const { forecasts, sessionId } = req.body;
  if (!Array.isArray(forecasts)) {
    return res.status(400).json({ error: 'forecasts must be an array' });
  }
  setUserForecasts(userId, forecasts, sessionId);
  res.json({ success: true, count: forecasts.length });
});

// Add a single forecast
app.post('/api/forecasts/:userId/add', (req, res) => {
  const { userId } = req.params;
  const { sessionId } = req.query;
  const forecast = req.body;
  if (!forecast.valueDate || forecast.amount === undefined) {
    return res.status(400).json({ error: 'valueDate and amount are required' });
  }
  const forecasts = getUserForecasts(userId, sessionId);
  forecast.id = Date.now();
  forecasts.push(forecast);
  setUserForecasts(userId, forecasts, sessionId);
  res.json({ success: true, forecast, count: forecasts.length });
});

// Delete a forecast by id
app.delete('/api/forecasts/:userId/:forecastId', (req, res) => {
  const { userId, forecastId } = req.params;
  const { sessionId } = req.query;
  let forecasts = getUserForecasts(userId, sessionId);
  const initialLength = forecasts.length;
  forecasts = forecasts.filter(f => f.id !== parseInt(forecastId));
  setUserForecasts(userId, forecasts, sessionId);
  res.json({ success: true, deleted: initialLength - forecasts.length, count: forecasts.length });
});

// Clear all forecasts for a session
app.delete('/api/forecasts/:userId', (req, res) => {
  const { userId } = req.params;
  const { sessionId } = req.query;
  setUserForecasts(userId, [], sessionId);
  res.json({ success: true, count: 0 });
});

// Generate rules from transactions using AI
app.post('/api/category-rules/generate/:userId', async (req, res) => {
  const { userId } = req.params;
  const { sessionId } = req.query;
  const data = loadDb();
  
  console.log('🤖 Generating rules for userId:', userId, 'sessionId:', sessionId);

  // Get all transactions (new structure: data.transactions array)
  let allTransactions = data.transactions || [];
  
  // Filter by sessionId if provided
  if (sessionId) {
    allTransactions = allTransactions.filter(tx => tx.session_id === sessionId);
  }

  // Get unique descriptions
  const uniqueDescriptions = [...new Set(allTransactions.map(tx => tx.description || ''))].filter(d => d && d.length > 3).slice(0, 200);

  console.log('📝 Analyzing', uniqueDescriptions.length, 'unique transaction descriptions');

  if (uniqueDescriptions.length === 0) {
    return res.status(400).json({ error: 'No transactions to analyze' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a financial transaction categorizer. Analyze these transaction descriptions and create categorization rules.
            
Return ONLY a valid JSON array of rules. Each rule must have:
- category: string with emoji prefix (e.g., "🍔 Food", "🚕 Transport", "💰 Income")
- keywords: array of lowercase keywords that match this category

Group similar transactions together. Be specific with keywords - use merchant names, not generic words.
Create 15-25 rules maximum. Focus on recurring patterns.

Example output:
[
  {"category": "🍔 Restauration", "keywords": ["restaurant", "cafe", "mcdonald", "burger king"]},
  {"category": "🚕 Transport", "keywords": ["uber", "taxi", "bolt", "lyft"]},
  {"category": "🛒 Courses", "keywords": ["carrefour", "leclerc", "monoprix", "franprix"]},
  {"category": "💰 Revenus", "keywords": ["salaire", "salary", "virement recu"]},
  {"category": "🏠 Logement", "keywords": ["loyer", "edf", "engie", "eau"]}
]`
          },
          {
            role: 'user',
            content: `Analyze these French/European bank transaction descriptions and create categorization rules:\n\n${uniqueDescriptions.join('\n')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      console.log('🤖 GPT Response received');
      
      let newRules;
      try {
        // Try direct parse
        newRules = JSON.parse(content);
      } catch (e) {
        // Try extracting from markdown code block
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          newRules = JSON.parse(jsonMatch[1]);
        } else {
          // Try finding array in content
          const arrayMatch = content.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            newRules = JSON.parse(arrayMatch[0]);
          } else {
            throw new Error('Could not parse AI response');
          }
        }
      }

      // Add IDs to new rules and save for this session
      const rules = newRules.map((r, i) => ({ 
        ...r, 
        id: Date.now() + i,
        keywords: r.keywords.map(k => k.toLowerCase())
      }));
      saveCategoryRules(rules, sessionId);
      
      console.log('✅ Generated', rules.length, 'rules for session:', sessionId);
      
      res.json({ rules, generated: true });
    } else {
      const err = await response.text();
      console.error('❌ OpenAI error:', err);
      res.status(500).json({ error: 'AI generation failed', details: err });
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Recategorize all transactions for a session
app.post('/api/recategorize/:userId', (req, res) => {
  const { userId } = req.params;
  const { sessionId } = req.query;
  const db = loadDb();
  
  console.log('🔄 Recategorizing for session:', sessionId);

  // Filter transactions by sessionId
  let transactions = db.transactions || [];
  if (sessionId) {
    transactions = transactions.filter(tx => tx.session_id === sessionId);
  }

  let count = 0;
  for (const tx of transactions) {
    const newCategory = categorizeTransactionWithSession(tx.description, sessionId);
    if (tx.category !== newCategory) {
      tx.category = newCategory;
      count++;
    }
  }

  saveDb(db);
  console.log('✅ Recategorized', count, 'transactions');
  res.json({ success: true, recategorized: count });
});

// ============================================
// FX RATES - FETCH ONCE AT STARTUP + CACHE
// ============================================
let FX_RATES = { EUR: 1 };

async function loadFxRates() {
  try {
    console.log('Fetching FX rates from ECB...');
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR');
    if (res.ok) {
      const data = await res.json();
      FX_RATES = { EUR: 1 };
      for (const [currency, rate] of Object.entries(data.rates)) {
        // Rate is EUR -> X, we need X -> EUR, so invert
        FX_RATES[currency] = 1 / rate;
      }
      console.log('✅ FX rates loaded:', Object.keys(FX_RATES).length, 'currencies');
      console.log('   Sample: 1 HUF =', FX_RATES.HUF?.toFixed(6), 'EUR');
      console.log('   Sample: 1 USD =', FX_RATES.USD?.toFixed(6), 'EUR');
    } else {
      console.error('❌ Failed to fetch FX rates:', res.status);
    }
  } catch (err) {
    console.error('❌ FX rates error:', err.message);
  }
}

// Load FX rates at startup
loadFxRates();
// Refresh every hour
setInterval(loadFxRates, 3600000);

function toEUR(amount, currency) {
  if (!currency || currency === 'EUR') return amount;
  const rate = FX_RATES[currency];
  if (!rate) {
    // Silently return amount if no rate (AED, RUB, etc.)
    return amount;
  }
  return amount * rate;
}

// ============================================
// AUTH ROUTES
// ============================================
app.get('/api/auth/connect-url', (req, res) => {
  const { userId, sessionId } = req.query;  // sessionId = which user session (Vincent, Brigitte)
  const redirectUri = `${API_BASE_URL}/callback`;
  
  const db = loadDb();
  
  let connectUrl = 
    `https://webview.powens.com/connect` +
    `?domain=psd2-sandbox.biapi.pro` +
    `&client_id=80110236` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  // Store sessionId for callback
  if (sessionId) {
    fs.writeFileSync('pending_session.txt', sessionId);
    console.log('🔑 Session for new bank:', sessionId);
  }
  
  // If existing user, pass their access token to add new bank to same user
  if (userId) {
    const user = db.users.find(u => u.powens_user_id === userId);
    if (user && user.access_token) {
      connectUrl += `&code=${user.access_token}`;
      fs.writeFileSync('pending_user.txt', userId);
      console.log('Adding bank to existing user:', userId);
    } else {
      console.log('User not found or no token, creating new user');
    }
  } else {
    if (fs.existsSync('pending_user.txt')) fs.unlinkSync('pending_user.txt');
    console.log('Creating new user connection');
  }
  
  res.json({ url: connectUrl });
});

app.get('/callback', async (req, res) => {
  const { code, user_id, connection_id } = req.query;
  
  // Read pending sessionId
  let pendingSessionId = null;
  if (fs.existsSync('pending_session.txt')) {
    pendingSessionId = fs.readFileSync('pending_session.txt', 'utf-8').trim();
    fs.unlinkSync('pending_session.txt');
  }
  console.log('🔑 Callback with sessionId:', pendingSessionId);
  
  // Case 1: Adding bank to existing user (no code, just connection_id)
  if (!code && connection_id) {
    console.log('🏦 New bank connection added:', connection_id);
    const db = loadDb();
    
    // Read pending userId from file
    let pendingUserId = null;
    if (fs.existsSync('pending_user.txt')) {
      pendingUserId = fs.readFileSync('pending_user.txt', 'utf-8').trim();
      fs.unlinkSync('pending_user.txt');
    }
    
    const user = pendingUserId ? db.users.find(u => u.powens_user_id === pendingUserId) : null;
    
    if (user) {
      console.log('  → Syncing new connection for user:', user.powens_user_id, 'session:', pendingSessionId);
      try {
        await syncUserData(user.powens_user_id, user.access_token, db, pendingSessionId);
        reloadSession();
        console.log('  ✅ Bank added and synced successfully');
      } catch (e) {
        console.error('  ✗ Sync error:', e.message);
      }
      return res.redirect(`${BASE_URL}/dashboard?user=${user.powens_user_id}`);
    }
    console.log('No pending user found, redirecting to home');
    return res.redirect(BASE_URL);
  }
  
  // Case 2: New user OAuth flow (has code)
  if (!code) return res.status(400).send('Missing code');

  try {
    console.log('🔐 New OAuth flow starting...');
    const params = new URLSearchParams();
    params.append('client_id', '80110236');
    params.append('client_secret', 'tsoEqNK3_9cqd0FCpXN_qbyLM3DF4xOy');
    params.append('code', code);

    const response = await fetch('https://psd2-sandbox.biapi.pro/auth/token/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.description || 'Token error');

    const accessToken = data.access_token;
    const finalUserId = String(data.user?.id || user_id || `user_${Date.now()}`);
    console.log('  → User ID:', finalUserId, 'Session:', pendingSessionId);

    let db = loadDb();
    let user = db.users.find(u => u.powens_user_id === finalUserId);
    if (user) {
      user.access_token = accessToken;
      if (pendingSessionId) user.session_id = pendingSessionId;
    } else {
      db.users.push({ 
        id: db.users.length + 1, 
        powens_user_id: finalUserId, 
        access_token: accessToken, 
        session_id: pendingSessionId,
        created_at: new Date().toISOString() 
      });
    }
    saveDb(db);

    await syncUserData(finalUserId, accessToken, db, pendingSessionId);
    reloadSession();
    console.log('  ✅ New user synced successfully');
    res.redirect(`${BASE_URL}/dashboard?user=${finalUserId}`);

  } catch (err) {
    console.error('Callback error:', err.message);
    res.redirect(`${BASE_URL}/error?message=${encodeURIComponent(err.message)}`);
  }
});

// ============================================
// DB HELPERS
// ============================================
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { users: [], accounts: [], transactions: [] };
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ============================================
// SYNC
// ============================================
async function syncUserData(userId, accessToken, db, sessionId = null) {
  console.log('Syncing user', userId, 'for session:', sessionId);
  try {
    // First, get connections to map connection_id to bank name
    let connRes = await fetch(`https://psd2-sandbox.biapi.pro/users/me/connections`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const connectionMap = {};
    if (connRes.ok) {
      const connData = await connRes.json();
      for (const conn of connData.connections || []) {
        connectionMap[conn.id] = conn.connector?.name || conn.connector_uuid || `Bank ${conn.id}`;
      }
    }

    // Get accounts
    let res = await fetch(`https://psd2-sandbox.biapi.pro/users/me/accounts`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      res = await fetch(`https://psd2-sandbox.biapi.pro/users/${userId}/accounts`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    }
    if (!res.ok) return;

    const accountsData = await res.json();
    
    for (const account of accountsData.accounts || []) {
      const existing = db.accounts.find(a => a.powens_account_id === account.id && a.session_id === sessionId);
      const bankName = connectionMap[account.id_connection] || `Bank ${account.id_connection}`;
      const obj = {
        powens_account_id: account.id,
        powens_user_id: userId,
        session_id: sessionId,  // ✅ Link to session
        name: account.name || account.original_name || 'Compte',
        balance: account.balance || 0,
        currency: account.currency?.id || 'EUR',
        type: account.type || 'checking',
        connection_id: account.id_connection,
        bank_name: bankName,
        last_sync: new Date().toISOString()
      };
      if (existing) Object.assign(existing, obj);
      else { obj.id = db.accounts.length + 1; db.accounts.push(obj); }

      await syncTransactions(userId, account.id, accessToken, db, sessionId);
    }
    saveDb(db);
    reloadSession();
    console.log('Sync done');
  } catch (err) {
    console.error('Sync error:', err.message);
  }
}

async function syncTransactions(userId, accountId, accessToken, db, sessionId = null) {
  try {
    let res = await fetch(
      `https://psd2-sandbox.biapi.pro/users/me/accounts/${accountId}/transactions?limit=500`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      res = await fetch(
        `https://psd2-sandbox.biapi.pro/users/${userId}/accounts/${accountId}/transactions?limit=500`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
    }
    if (!res.ok) return;

    const txData = await res.json();
    for (const tx of txData.transactions || []) {
      // Check for existing with same session
      if (!db.transactions.find(t => t.powens_transaction_id === tx.id && t.session_id === sessionId)) {
        const desc = tx.original_wording || tx.simplified_wording || 'Transaction';
        db.transactions.push({
          id: db.transactions.length + 1,
          powens_transaction_id: tx.id,
          powens_account_id: accountId,
          powens_user_id: userId,
          session_id: sessionId,  // ✅ Link to session
          amount: tx.value || 0,
          date: tx.date || tx.rdate,
          description: desc,
          category: categorizeTransaction(desc)
        });
      }
    }
  } catch (err) {
    console.error('Tx sync error:', err.message);
  }
}

// ============================================
// API: DASHBOARD - ALL IN EUR
// ============================================
app.get('/api/dashboard/:userId', (req, res) => {
  const { userId } = req.params;
  const { sessionId } = req.query;  // ✅ Get sessionId from query param
  const db = loadDb();

  console.log(`📊 Dashboard request - userId: ${userId}, sessionId: ${sessionId}`);

  // ✅ FILTER by sessionId first, then deduplicate
  const sessionAccounts = sessionId 
    ? (db.accounts || []).filter(a => a.session_id === sessionId)
    : (db.accounts || []);

  // ✅ DEDUPLICATE accounts by name+currency+type (sandbox creates different IDs for same account)
  const accountsMap = new Map();
  for (const acc of sessionAccounts) {
    const key = `${acc.name}|${acc.currency}|${acc.type}`;
    if (!accountsMap.has(key) || new Date(acc.last_sync) > new Date(accountsMap.get(key).last_sync)) {
      accountsMap.set(key, acc);
    }
  }
  const accounts = Array.from(accountsMap.values());
  if (!accounts.length) return res.json({ 
    totalBalance: 0, totalInflow: 0, totalOutflow: 0, 
    accounts: [], transactions: [], cashFlow: [], categories: [], fxRates: FX_RATES 
  });

  // Build set of valid account IDs (deduplicated)
  const validAccountIds = new Set(accounts.map(a => a.powens_account_id));

  // 1. TOTAL BALANCE IN EUR - ALL ACCOUNTS (deduplicated)
  let totalBalance = 0;
  for (const acc of accounts) {
    const eurValue = toEUR(acc.balance || 0, acc.currency);
    totalBalance += eurValue;
  }

  // Build account -> currency map
  const accountCurrency = {};
  for (const acc of accounts) {
    accountCurrency[acc.powens_account_id] = acc.currency || 'EUR';
  }

  // ✅ FILTER transactions by sessionId, then deduplicate
  const sessionTx = sessionId
    ? (db.transactions || []).filter(t => t.session_id === sessionId)
    : (db.transactions || []);

  // ✅ DEDUPLICATE transactions: only keep tx from valid (deduplicated) accounts
  const txMap = new Map();
  for (const tx of sessionTx) {
    if (!validAccountIds.has(tx.powens_account_id)) continue;
    const key = `${tx.description}|${tx.date}|${tx.amount}`;
    if (!txMap.has(key)) txMap.set(key, tx);
  }

  // 2. TRANSACTIONS WITH EUR CONVERSION (deduplicated)
  const allTx = Array.from(txMap.values())
    .map(t => {
      const currency = accountCurrency[t.powens_account_id] || 'EUR';
      const amountEUR = toEUR(t.amount, currency);
      const category = t.category || categorizeTransaction(t.description);
      return { ...t, currency, amountEUR, category };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const transactions = allTx.slice(0, 100);

  // 3. CASH FLOW - LAST 90 DAYS - IN EUR
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentTx = allTx.filter(t => new Date(t.date) >= ninetyDaysAgo);

  const cashFlowMap = {};
  for (const tx of recentTx) {
    const date = tx.date?.split('T')[0] || tx.date;
    if (!cashFlowMap[date]) cashFlowMap[date] = { date, inflow: 0, outflow: 0 };
    if (tx.amountEUR > 0) cashFlowMap[date].inflow += tx.amountEUR;
    else cashFlowMap[date].outflow += tx.amountEUR;
  }
  const cashFlow = Object.values(cashFlowMap).sort((a, b) => a.date.localeCompare(b.date));

  // 4. TOTALS IN EUR
  const totalInflow = recentTx.filter(t => t.amountEUR > 0).reduce((s, t) => s + t.amountEUR, 0);
  const totalOutflow = Math.abs(recentTx.filter(t => t.amountEUR < 0).reduce((s, t) => s + t.amountEUR, 0));

  // 5. CATEGORIES IN EUR
  const catMap = {};
  for (const tx of recentTx) {
    if (tx.amountEUR < 0) {
      const cat = tx.category;
      if (!catMap[cat]) catMap[cat] = { category: cat, total: 0, count: 0 };
      catMap[cat].total += Math.abs(tx.amountEUR);
      catMap[cat].count++;
    }
  }
  const categories = Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 10);

  console.log(`📊 Dashboard: ${accounts.length} accounts (deduped from ${db.accounts?.length}), ${allTx.length} tx (deduped from ${db.transactions?.length}), balance: ${Math.round(totalBalance)}€`);

  res.json({
    totalBalance: Math.round(totalBalance * 100) / 100,
    totalInflow: Math.round(totalInflow * 100) / 100,
    totalOutflow: Math.round(totalOutflow * 100) / 100,
    accounts,
    transactions,
    cashFlow: cashFlow.map(cf => ({
      date: cf.date,
      inflow: Math.round(cf.inflow * 100) / 100,
      outflow: Math.round(cf.outflow * 100) / 100
    })),
    categories: categories.map(c => ({
      category: c.category,
      total: Math.round(c.total * 100) / 100,
      count: c.count
    })),
    fxRates: FX_RATES
  });
});

// ============================================
// API: FORECAST - IN EUR
// ============================================
app.get('/api/forecast/:userId', (req, res) => {
  const { userId } = req.params;
  const days = parseInt(req.query.days) || 30;
  const db = loadDb();

  const accounts = db.accounts.filter(a => a.powens_user_id === userId);
  
  // Current balance in EUR
  let currentBalance = 0;
  for (const acc of accounts) {
    currentBalance += toEUR(acc.balance || 0, acc.currency);
  }

  // Account currency map
  const accountCurrency = {};
  for (const acc of accounts) {
    accountCurrency[acc.powens_account_id] = acc.currency || 'EUR';
  }

  // Last 90 days transactions in EUR
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentTx = db.transactions
    .filter(t => t.powens_user_id === userId && new Date(t.date) >= ninetyDaysAgo)
    .map(t => ({
      ...t,
      amountEUR: toEUR(t.amount, accountCurrency[t.powens_account_id] || 'EUR')
    }));

  // Daily totals in EUR
  const dailyTotals = {};
  for (const tx of recentTx) {
    const date = tx.date?.split('T')[0] || tx.date;
    dailyTotals[date] = (dailyTotals[date] || 0) + tx.amountEUR;
  }

  const vals = Object.values(dailyTotals);
  const avgDaily = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

  // Generate forecast
  const forecast = [];
  let balance = currentBalance;
  const today = new Date();

  for (let i = 0; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    forecast.push({
      date: date.toISOString().split('T')[0],
      balance: Math.round(balance * 100) / 100
    });
    balance += avgDaily;
  }

  res.json({
    currentBalance: Math.round(currentBalance * 100) / 100,
    avgDailyFlow: Math.round(avgDaily * 100) / 100,
    forecast
  });
});

// ============================================
// API: SYNC & RECATEGORIZE
// ============================================
app.post('/api/sync/:userId', async (req, res) => {
  const { userId } = req.params;
  const { sessionId } = req.query;  // ✅ Get sessionId from query
  const db = loadDb();
  
  // ✅ SYNC only users for this session
  let syncCount = 0;
  console.log(`🔄 Starting sync for session: ${sessionId}`);
  
  for (const user of (db.users || [])) {
    // Only sync users belonging to this session (or all if no sessionId)
    if (user.access_token && (!sessionId || user.session_id === sessionId)) {
      console.log(`  → Syncing user: ${user.powens_user_id} (session: ${user.session_id})`);
      try {
        await syncUserData(user.powens_user_id, user.access_token, db, user.session_id);
        syncCount++;
      } catch (e) {
        console.error(`  ✗ Error syncing ${user.powens_user_id}:`, e.message);
      }
    }
  }
  
  reloadSession();
  
  console.log(`✅ Sync complete: ${syncCount} users synced`);
  res.json({ success: true, syncedUsers: syncCount });
});

app.get('/api/users', (req, res) => {
  const db = loadDb();
  res.json(db.users.map(u => ({ id: u.id, powens_user_id: u.powens_user_id })));
});

// ============================================
// API: CATEGORIES TIME SERIES
// ============================================
app.get('/api/categories-timeseries/:userId', (req, res) => {
  const { userId } = req.params;
  const { sessionId } = req.query;
  const days = parseInt(req.query.days) || 90;
  const db = loadDb();

  // ✅ FILTER by sessionId first
  let sessionAccounts = sessionId 
    ? (db.accounts || []).filter(a => a.session_id === sessionId)
    : (db.accounts || []);

  // ✅ DEDUPLICATE accounts by name+currency+type
  const accountsMap = new Map();
  for (const acc of sessionAccounts) {
    const key = `${acc.name}|${acc.currency}|${acc.type}`;
    if (!accountsMap.has(key)) accountsMap.set(key, acc);
  }
  const validAccountIds = new Set(Array.from(accountsMap.values()).map(a => a.powens_account_id));
  
  // Account currency map
  const accountCurrency = {};
  for (const acc of accountsMap.values()) {
    accountCurrency[acc.powens_account_id] = acc.currency || 'EUR';
  }

  // ✅ FILTER transactions by sessionId
  let sessionTx = sessionId
    ? (db.transactions || []).filter(t => t.session_id === sessionId)
    : (db.transactions || []);

  // ✅ DEDUPLICATE transactions by description+date+amount
  const txMap = new Map();
  for (const tx of sessionTx) {
    if (!validAccountIds.has(tx.powens_account_id)) continue;
    const key = `${tx.description}|${tx.date}|${tx.amount}`;
    if (!txMap.has(key)) txMap.set(key, tx);
  }

  // Get transactions from last N days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Include ALL transactions (income AND expenses), keep the sign
  const transactions = Array.from(txMap.values())
    .filter(t => new Date(t.date) >= startDate)
    .map(t => {
      const currency = accountCurrency[t.powens_account_id] || 'EUR';
      const amountEUR = toEUR(t.amount, currency); // Keep sign!
      const category = t.category || categorizeTransaction(t.description);
      return { date: t.date?.split('T')[0] || t.date, category, amountEUR };
    });

  // Separate income and expense categories
  const incomeCategories = new Set(['💰 Revenus', '💸 Virements']);
  
  // Group by week and category (expenses negative, income positive)
  const weeklyData = {};
  const allCategories = new Set();

  for (const tx of transactions) {
    const date = new Date(tx.date);
    // Get Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    const weekStart = date.toISOString().split('T')[0];

    if (!weeklyData[weekStart]) weeklyData[weekStart] = {};
    if (!weeklyData[weekStart][tx.category]) weeklyData[weekStart][tx.category] = 0;
    
    // Keep expenses negative, income positive
    weeklyData[weekStart][tx.category] += tx.amountEUR;
    allCategories.add(tx.category);
  }

  // Convert to array format for charts
  const categories = Array.from(allCategories).sort((a, b) => {
    // Sort income categories first (positive), then expenses
    const aIsIncome = incomeCategories.has(a) || a.includes('Revenu') || a.includes('Income');
    const bIsIncome = incomeCategories.has(b) || b.includes('Revenu') || b.includes('Income');
    if (aIsIncome && !bIsIncome) return -1;
    if (!aIsIncome && bIsIncome) return 1;
    return a.localeCompare(b);
  });

  const timeseries = Object.entries(weeklyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, cats]) => {
      const row = { week };
      for (const cat of categories) {
        row[cat] = Math.round((cats[cat] || 0) * 100) / 100;
      }
      return row;
    });

  // Also provide per-category series for expanded view
  const categoryTimeseries = {};
  for (const cat of categories) {
    categoryTimeseries[cat] = timeseries.map(row => ({
      week: row.week,
      amount: row[cat] || 0
    }));
  }

  res.json({
    categories,
    timeseries,
    categoryTimeseries
  });
});

// ============================================
// API: AI FORECAST (OpenAI GPT-4)
// ============================================
app.post('/api/forecast-ai/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = loadDb();

  const accounts = db.accounts.filter(a => a.powens_user_id === userId);
  
  // Account currency map
  const accountCurrency = {};
  for (const acc of accounts) {
    accountCurrency[acc.powens_account_id] = acc.currency || 'EUR';
  }

  // Get 90 days of transactions
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const transactions = db.transactions
    .filter(t => t.powens_user_id === userId && new Date(t.date) >= startDate)
    .map(t => {
      const currency = accountCurrency[t.powens_account_id] || 'EUR';
      const amountEUR = toEUR(t.amount, currency);
      const category = t.category || categorizeTransaction(t.description);
      return { date: t.date?.split('T')[0] || t.date, category, amountEUR };
    });

  // Aggregate by week and category
  const weeklyData = {};
  for (const tx of transactions) {
    const date = new Date(tx.date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    const weekStart = date.toISOString().split('T')[0];

    if (!weeklyData[weekStart]) weeklyData[weekStart] = {};
    if (!weeklyData[weekStart][tx.category]) weeklyData[weekStart][tx.category] = 0;
    weeklyData[weekStart][tx.category] += tx.amountEUR;
  }

  // Format for GPT
  const historicalData = Object.entries(weeklyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, cats]) => ({ week, ...cats }));

  const categories = [...new Set(transactions.map(t => t.category))].sort();

  // Call OpenAI
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a financial forecasting expert. Analyze spending patterns and predict future expenses by category.
            
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "forecast": [
    {"week": "2025-01-06", "category1": 123.45, "category2": 67.89},
    ...
  ],
  "insights": "Brief insight about spending patterns"
}`
          },
          {
            role: 'user',
            content: `Here is weekly spending data by category (in EUR) for the last 90 days:

${JSON.stringify(historicalData, null, 2)}

Categories: ${categories.join(', ')}

Predict spending for the next 12 weeks (90 days) for each category. Consider:
- Weekly patterns
- Seasonal trends
- Category-specific behavior (e.g., subscriptions are recurring, groceries are regular)

Return forecast data for weeks starting from ${new Date().toISOString().split('T')[0]}.`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!openaiResponse.ok) {
      const err = await openaiResponse.text();
      console.error('OpenAI error:', err);
      return res.status(500).json({ error: 'OpenAI API error' });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content;
    
    console.log('GPT Response:', content);

    // Parse JSON from response
    let forecast;
    try {
      forecast = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        forecast = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not parse forecast');
      }
    }

    res.json({
      historical: historicalData,
      forecast: forecast.forecast,
      insights: forecast.insights,
      categories
    });

  } catch (err) {
    console.error('Forecast AI error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: GENERATE WIDGET (AI)
// ============================================
app.post('/api/generate-widget/:userId', async (req, res) => {
  const { userId } = req.params;
  const { prompt, sessionId } = req.body;
  const db = loadDb();

  console.log('🎨 Generating widget for session:', sessionId, 'prompt:', prompt);

  // Get accounts filtered by session
  let accounts = db.accounts || [];
  if (sessionId) {
    accounts = accounts.filter(a => a.session_id === sessionId);
  }
  
  const accountIds = new Set(accounts.map(a => a.powens_account_id));
  const accountCurrency = {};
  for (const acc of accounts) {
    accountCurrency[acc.powens_account_id] = acc.currency || 'EUR';
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  // Get transactions filtered by session
  let transactions = db.transactions || [];
  if (sessionId) {
    transactions = transactions.filter(t => t.session_id === sessionId);
  }
  
  transactions = transactions
    .filter(t => accountIds.has(t.powens_account_id) && new Date(t.date) >= startDate)
    .map(t => {
      const currency = accountCurrency[t.powens_account_id] || 'EUR';
      const amountEUR = toEUR(t.amount, currency);
      return { date: t.date?.split('T')[0], category: t.category, amountEUR, description: t.description };
    });

  console.log('📊 Found', transactions.length, 'transactions for widget generation');

  if (transactions.length === 0) {
    return res.status(400).json({ error: 'No transactions found for this session' });
  }

  // Aggregate data for AI
  const categoryTotals = {};
  const weeklyData = {};
  const monthlyData = {};
  const dailyData = {};

  for (const tx of transactions) {
    // Category totals (only expenses)
    if (tx.amountEUR < 0) {
      if (!categoryTotals[tx.category]) categoryTotals[tx.category] = 0;
      categoryTotals[tx.category] += Math.abs(tx.amountEUR);
    }

    // Daily
    if (!dailyData[tx.date]) dailyData[tx.date] = { inflow: 0, outflow: 0 };
    if (tx.amountEUR >= 0) dailyData[tx.date].inflow += tx.amountEUR;
    else dailyData[tx.date].outflow += Math.abs(tx.amountEUR);

    // Weekly
    const date = new Date(tx.date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff)).toISOString().split('T')[0];
    if (!weeklyData[weekStart]) weeklyData[weekStart] = { inflow: 0, outflow: 0 };
    if (tx.amountEUR >= 0) weeklyData[weekStart].inflow += tx.amountEUR;
    else weeklyData[weekStart].outflow += Math.abs(tx.amountEUR);

    // Monthly
    const month = tx.date?.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { inflow: 0, outflow: 0 };
    if (tx.amountEUR >= 0) monthlyData[month].inflow += tx.amountEUR;
    else monthlyData[month].outflow += Math.abs(tx.amountEUR);
  }

  // Calculate account balances
  const accountBalances = accounts.map(a => ({
    name: a.name,
    balance: a.balance,
    currency: a.currency
  }));

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a financial dashboard widget generator. Create charts based on user requests and their financial data.

Return ONLY valid JSON (no markdown, no backticks):
{
  "title": "Chart title in user's language",
  "type": "bar" | "line" | "pie" | "area",
  "chartData": [{"name": "Label", "value": 123}, ...]
}

Rules:
- "pie" for breakdowns/comparisons (categories, accounts)
- "bar" for comparing values (monthly, weekly comparisons)
- "line" for trends over time
- "area" for cumulative/filled trends
- chartData must have "name" and "value" keys
- Values should be positive numbers
- name should be short labels (dates as "Oct", "Nov" or "W1", "W2")
- Limit to max 12 data points for readability
- Round values to 2 decimals`
          },
          {
            role: 'user',
            content: `Request: "${prompt}"

Financial Data (last 90 days):
- Expenses by category: ${JSON.stringify(categoryTotals)}
- Weekly flows: ${JSON.stringify(Object.entries(weeklyData).slice(-8).reduce((a, [k, v]) => ({...a, [k]: v}), {}))}
- Monthly flows: ${JSON.stringify(monthlyData)}
- Account balances: ${JSON.stringify(accountBalances)}
- Total transactions: ${transactions.length}

Create a widget that answers the user's request. Use the most relevant data.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!openaiResponse.ok) {
      return res.status(500).json({ error: 'OpenAI API error' });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content;

    let widget;
    try {
      widget = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) widget = JSON.parse(jsonMatch[1]);
      else throw new Error('Could not parse widget');
    }

    res.json(widget);

  } catch (err) {
    console.error('Widget generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: PARSE FORECASTS FROM FILES (AI)
// ============================================
app.post('/api/parse-forecasts/:userId', upload.array('files', 20), async (req, res) => {
  console.log('📄 Parse forecasts request received');
  const files = req.files;
  if (!files || files.length === 0) {
    console.log('❌ No files uploaded');
    return res.status(400).json({ error: 'No files uploaded' });
  }
  console.log(`📁 Processing ${files.length} file(s):`, files.map(f => f.originalname));

  const allForecasts = [];

  for (const file of files) {
    try {
      let textContent = '';
      const ext = file.originalname.toLowerCase().split('.').pop();
      console.log(`  Processing: ${file.originalname} (${ext})`);

      // Extract text based on file type
      if (ext === 'pdf') {
        console.log('    Parsing PDF...');
        textContent = await extractPdfText(file.buffer);
        console.log(`    PDF text extracted: ${textContent.length} chars`);
      } else if (ext === 'csv') {
        textContent = file.buffer.toString('utf-8');
        console.log(`    CSV text: ${textContent.length} chars`);
      } else if (['xlsx', 'xls'].includes(ext)) {
        console.log('    Parsing Excel...');
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheets = workbook.SheetNames.map(name => {
          const sheet = workbook.Sheets[name];
          return XLSX.utils.sheet_to_csv(sheet);
        });
        textContent = sheets.join('\n\n');
        console.log(`    Excel text: ${textContent.length} chars`);
      } else {
        console.log(`    Skipping unsupported file type: ${ext}`);
        continue;
      }

      // Use GPT to extract forecast data
      console.log('    Calling OpenAI...');
      console.log('    Text preview:', textContent.substring(0, 500));
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a financial document parser specializing in extracting payment/invoice/forecast data.

TASK: Extract ALL financial transactions or future payments from the document.

For INVOICES, extract:
- transactionDate: Invoice date (YYYY-MM-DD)
- valueDate: Due date / Payment date (YYYY-MM-DD) 
- amount: NEGATIVE number (it's money to pay out)
- currency: 3-letter code (EUR, USD, GBP, etc.)
- note: "Invoice from [vendor] - [invoice number] - [description]"

For LOAN SCHEDULES, extract EACH payment row:
- transactionDate: Payment date (YYYY-MM-DD)
- valueDate: Same as transactionDate
- amount: NEGATIVE for payments, positive for disbursements
- currency: The loan currency
- note: "Loan payment #X - Principal: X, Interest: X"

For BANK STATEMENTS, extract each transaction.

CRITICAL RULES:
1. Return ONLY a valid JSON array - no markdown, no explanation
2. Use YYYY-MM-DD date format
3. Outflows/payments = NEGATIVE amounts
4. Inflows/receipts = POSITIVE amounts
5. If unsure about date, use current year
6. Extract ALL rows from tables, not just summary
7. If document is empty or unreadable, return: []

Example output:
[{"transactionDate":"2025-02-15","valueDate":"2025-02-15","amount":-1500.00,"currency":"EUR","note":"Invoice from Acme Corp - INV-001"}]`
            },
            {
              role: 'user',
              content: `Parse this financial document and extract ALL transactions/payments:\n\n${textContent.substring(0, 15000)}`
            }
          ],
          temperature: 0.1,
          max_tokens: 4000
        })
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        const content = data.choices[0]?.message?.content;
        console.log('    OpenAI response received:', content?.substring(0, 200));
        
        let forecasts;
        try {
          forecasts = JSON.parse(content);
        } catch (e) {
          console.log('    Direct JSON parse failed, trying markdown extraction...');
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) forecasts = JSON.parse(jsonMatch[1]);
          else forecasts = [];
        }

        console.log(`    Extracted ${Array.isArray(forecasts) ? forecasts.length : 0} forecast(s)`);
        if (Array.isArray(forecasts)) {
          allForecasts.push(...forecasts.map(f => ({
            transactionDate: f.transactionDate || '',
            valueDate: f.valueDate || f.transactionDate || '',
            amount: parseFloat(f.amount) || 0,
            currency: f.currency || 'EUR',
            note: f.note || '',
            sourceFile: file.originalname
          })));
        }
      } else {
        const errText = await openaiResponse.text();
        console.error('    OpenAI error:', openaiResponse.status, errText);
      }
    } catch (err) {
      console.error(`❌ Error processing ${file.originalname}:`, err.message);
    }
  }

  console.log(`✅ Total: ${allForecasts.length} forecasts from ${files.length} files`);
  res.json({ forecasts: allForecasts });
});

// ============================================
// API: SESSION FUSIONNÉE
// ============================================

// GET /api/session - Retourne la session complète
app.get('/api/session', (req, res) => {
  const session = getSession();
  res.json(session);
});

// GET /api/session/stats - Retourne les stats de la session
app.get('/api/session/stats', (req, res) => {
  const stats = getStats();
  res.json(stats);
});

// GET /api/session/users - Retourne la liste des users avec résumé
app.get('/api/session/users', (req, res) => {
  const session = getSession();
  const usersSummary = session.users.map(user => ({
    id: user.id,
    powens_user_id: user.powens_user_id,
    created_at: user.created_at,
    total_accounts: user.total_accounts,
    total_transactions: user.total_transactions,
    balance_by_currency: user.balance_by_currency
  }));
  res.json(usersSummary);
});

// GET /api/session/user/:userId - Retourne les données complètes d'un user
app.get('/api/session/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userData = getUserData(userId);
  
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(userData);
});

// GET /api/session/user/:userId/accounts - Retourne les accounts d'un user
app.get('/api/session/user/:userId/accounts', (req, res) => {
  const userId = parseInt(req.params.userId);
  const accounts = getUserAccounts(userId);
  
  res.json(accounts);
});

// GET /api/session/user/:userId/transactions - Retourne les transactions d'un user
app.get('/api/session/user/:userId/transactions', (req, res) => {
  const userId = parseInt(req.params.userId);
  const transactions = getUserTransactions(userId);
  
  res.json(transactions);
});

// POST /api/session/reload - Recharge la session
app.post('/api/session/reload', (req, res) => {
  const newSession = reloadSession();
  res.json({ 
    message: 'Session reloaded',
    session_id: newSession.session_id
  });
});

// ============================================
// START
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 K-Light Server on http://localhost:${PORT}`);
});
