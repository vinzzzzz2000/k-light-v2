import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine, ReferenceArea, ComposedChart } from 'recharts'
import { TrendingUp, TrendingDown, RefreshCw, Calendar, Maximize2, Minimize2, Plus, Sparkles, Building2, LayoutDashboard, Wand2, X, Upload, FileText, Trash2, Download, Tags, Edit2, Check, Search, LogOut, Sun, Moon, ChevronDown, ChevronUp, Menu } from 'lucide-react'

// Add scrollbar-hide utility styles
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`
if (typeof document !== 'undefined' && !document.getElementById('scrollbar-hide-styles')) {
  const style = document.createElement('style')
  style.id = 'scrollbar-hide-styles'
  style.textContent = scrollbarHideStyles
  document.head.appendChild(style)
}

const KYRIBA = { navy: '#050A12', navyLight: '#0A1220', lime: '#CDFA50', white: '#FFFFFF', gray: '#94A3B8', grayDark: '#1E293B', success: '#22C55E', danger: '#EF4444' }
const COLORS = [KYRIBA.lime, '#3B82F6', KYRIBA.success, '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', KYRIBA.danger]
const CURRENCY_INFO = { EUR: { flag: '🇪🇺' }, USD: { flag: '🇺🇸' }, GBP: { flag: '🇬🇧' }, HUF: { flag: '🇭🇺' }, PLN: { flag: '🇵🇱' }, CHF: { flag: '🇨🇭' } }

// Bank name mapping - Powens connector UUIDs to readable names
const BANK_NAMES = {
  // French banks
  'f5c29767-1bc8-5337-9e4e-68a0fbd91c9a': 'Société Générale',
  '338178e6-3d01-564f-9a7b-52ca442459bf': 'BNP Paribas',
  'cca2dec8-215d-4bb4-a4f1-ac20821bbe6a': 'Wise',
  '40': 'Crédit Agricole',
  '41': 'Crédit Mutuel',
  '2': 'La Banque Postale',
  '5': 'Caisse d\'Épargne',
  '8': 'LCL',
  '9': 'HSBC France',
  '15': 'Boursorama',
  '17': 'Fortuneo',
  '27': 'Hello Bank',
  '30': 'ING Direct',
  '82': 'N26',
  '83': 'Revolut',
  '119': 'Qonto',
  // Add more as needed
}

const getBankName = (bankId) => {
  if (!bankId) return 'Banque'
  // Check if it's in our mapping
  if (BANK_NAMES[bankId]) return BANK_NAMES[bankId]
  // Check if the ID contains hints
  const lower = String(bankId).toLowerCase()
  if (lower.includes('wise')) return 'Wise'
  if (lower.includes('revolut')) return 'Revolut'
  if (lower.includes('n26')) return 'N26'
  if (lower.includes('bnp')) return 'BNP Paribas'
  if (lower.includes('sg') || lower.includes('societe')) return 'Société Générale'
  if (lower.includes('credit')) return 'Crédit Agricole'
  // If UUID, show shortened version
  if (bankId.length > 20 && bankId.includes('-')) {
    return 'Banque ' + bankId.substring(0, 8)
  }
  return bankId
}
const T = {
  en: { balance: 'Consolidated Balance', banks: 'bank(s)', accounts: 'account(s)', currencies: 'currency(ies)', connectBank: 'Connect Bank', sync: 'Sync', inflows: 'Inflows', outflows: 'Outflows', flowsD30: 'Total Flows D+30', cashForecast: 'Cash Forecast', cashFlow: 'Cash Flow (90d)', noData: 'No data', categories: 'Categories', allAccounts: 'Accounts', transactions: 'Transactions', categoryHistory: 'History', expandAI: 'AI (+90d)', aiAnalysis: 'Analyzing...', days90: '(90d)', byBank: 'Bank', byAccount: 'Account', byCurrency: 'Currency', dashboard: 'Dashboard', custom: 'Custom', createWidget: 'Create Widget', widgetPrompt: 'Describe chart...', generating: 'Generating...', addWidget: 'Add', myWidgets: 'My Widgets', noWidgets: 'No widgets', forecast: 'Forecast', dropFiles: 'Drop PDF, Excel or CSV', orClick: 'or click', processing: 'Processing...', forecastTable: 'Forecasts', txDate: 'Tx Date', valDate: 'Val Date', amount: 'Amount', currency: 'Ccy', note: 'Note', noForecasts: 'No forecasts', clearAll: 'Clear', exportCSV: 'Export', back: 'Back', consolidate: 'Consolidate', detail: 'Detail', categorization: 'Categorization', categoryRules: 'Category Rules', generateAI: 'Generate with AI', addRule: 'Add Rule', keywords: 'Keywords', category: 'Category', deleteRule: 'Delete', editRule: 'Edit', resetRules: 'Reset Default', recategorize: 'Re-categorize All', noRules: 'No rules defined', generatingRules: 'AI is analyzing your transactions...', addManually: 'Add', importFiles: 'Import files' },
  fr: { balance: 'Solde Consolidé', banks: 'banque(s)', accounts: 'compte(s)', currencies: 'devise(s)', connectBank: 'Connecter', sync: 'Sync', inflows: 'Encaissements', outflows: 'Décaissements', flowsD30: 'Total Flux J+30', cashForecast: 'Prévision', cashFlow: 'Flux (90j)', noData: 'Aucune donnée', categories: 'Catégories', allAccounts: 'Comptes', transactions: 'Transactions', categoryHistory: 'Historique', expandAI: 'IA (+90j)', aiAnalysis: 'Analyse...', days90: '(90j)', byBank: 'Banque', byAccount: 'Compte', byCurrency: 'Devise', dashboard: 'Dashboard', custom: 'Custom', createWidget: 'Créer Widget', widgetPrompt: 'Décrivez...', generating: 'Génération...', addWidget: 'Ajouter', myWidgets: 'Mes Widgets', noWidgets: 'Aucun', forecast: 'Prévisions', dropFiles: 'Déposez PDF, Excel, CSV', orClick: 'ou cliquez', processing: 'Traitement...', forecastTable: 'Prévisions', txDate: 'Date Tx', valDate: 'Date Val', amount: 'Montant', currency: 'Dev', note: 'Note', noForecasts: 'Aucune', clearAll: 'Effacer', exportCSV: 'Export', back: 'Retour', consolidate: 'Consolider', detail: 'Détail', categorization: 'Catégorisation', categoryRules: 'Règles de Catégorisation', generateAI: 'Générer avec IA', addRule: 'Ajouter', keywords: 'Mots-clés', category: 'Catégorie', deleteRule: 'Supprimer', editRule: 'Modifier', resetRules: 'Réinitialiser', recategorize: 'Re-catégoriser', noRules: 'Aucune règle', generatingRules: "L'IA analyse vos transactions...", addManually: 'Ajouter', importFiles: 'Importer' },
}
const ALL_CURRENCIES = ['EUR', 'USD', 'GBP', 'HUF', 'PLN', 'CHF', 'JPY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'CZK']

export default function Dashboard({ session }) {
  const userId = session?.user_id || 'default'
  const sessionId = session?.name || session?.id || null  // ✅ Use session NAME as identifier
  console.log('📊 Dashboard loaded - userId:', userId, 'sessionId:', sessionId, 'session:', session)
  const [data, setData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [categoryTS, setCategoryTS] = useState(null)
  const [aiForecast, setAiForecast] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState(false)
  const [showAIForecast, setShowAIForecast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('k-light-lang') || 'en')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('k-light-dark-mode') !== 'false')
  const [showSessionDropdown, setShowSessionDropdown] = useState(false)
  const [availableSessions, setAvailableSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('k-light-sessions')) || [] } catch { return [] }
  })
  const [groupBy, setGroupBy] = useState('bank')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [widgets, setWidgets] = useState(() => { 
    try { 
      const allWidgets = JSON.parse(localStorage.getItem('k-light-widgets')) || {}
      return allWidgets[sessionId] || [] 
    } catch { return [] } 
  })
  const [widgetPrompt, setWidgetPrompt] = useState('')
  const [generatingWidget, setGeneratingWidget] = useState(false)
  const [importedForecasts, setImportedForecasts] = useState([])
  const [processingFiles, setProcessingFiles] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [cashFlowFreq, setCashFlowFreq] = useState('weekly')
  const [cashFlowRange, setCashFlowRange] = useState([-90, 30]) // [start, end] relative to today
  const [consolCcy, setConsolCcy] = useState(() => localStorage.getItem('k-light-consol-ccy') || 'EUR')
  const [fxPairs, setFxPairs] = useState(() => { try { return JSON.parse(localStorage.getItem('k-light-fx-pairs')) || ['EUR/USD', 'EUR/GBP', 'EUR/PLN', 'EUR/HUF'] } catch { return ['EUR/USD', 'EUR/GBP', 'EUR/PLN', 'EUR/HUF'] } })
  const [fxTicker, setFxTicker] = useState({})
  const [fxFlash, setFxFlash] = useState({})
  const [showAddFx, setShowAddFx] = useState(false)
  const [newFxCcy1, setNewFxCcy1] = useState('EUR')
  const [newFxCcy2, setNewFxCcy2] = useState('USD')
  const [realRates, setRealRates] = useState({})
  const [fxCollapsed, setFxCollapsed] = useState(() => localStorage.getItem('k-light-fx-collapsed') === 'true')
  const [categoryRules, setCategoryRules] = useState([])
  const [generatingRules, setGeneratingRules] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [newRuleCategory, setNewRuleCategory] = useState('')
  const [newRuleKeywords, setNewRuleKeywords] = useState('')
  const [txSearch, setTxSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = T[lang] || T.en

  useEffect(() => { 
    const allWidgets = JSON.parse(localStorage.getItem('k-light-widgets') || '{}')
    allWidgets[sessionId || '_default'] = widgets
    localStorage.setItem('k-light-widgets', JSON.stringify(allWidgets))
  }, [widgets, sessionId])
  useEffect(() => { localStorage.setItem('k-light-lang', lang) }, [lang])
  useEffect(() => { localStorage.setItem('k-light-dark-mode', darkMode) }, [darkMode])
  useEffect(() => { 
    // Close dropdown when clicking outside
    const handleClickOutside = () => setShowSessionDropdown(false)
    if (showSessionDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showSessionDropdown])
  useEffect(() => { if (userId) { localStorage.setItem('k-light-user', userId); loadData(); loadForecasts() } }, [userId, sessionId])
  useEffect(() => { localStorage.setItem('k-light-fx-pairs', JSON.stringify(fxPairs)) }, [fxPairs])
  useEffect(() => { localStorage.setItem('k-light-consol-ccy', consolCcy) }, [consolCcy])
  useEffect(() => { localStorage.setItem('k-light-fx-collapsed', fxCollapsed) }, [fxCollapsed])
  useEffect(() => { loadCategoryRules() }, [sessionId])

  // Session management functions
  const switchSession = (newSession) => {
    // Check if target session has a password
    if (newSession.password) {
      const enteredPassword = prompt(`Mot de passe pour ${newSession.name}:`)
      if (enteredPassword !== newSession.password) {
        alert('Mot de passe incorrect')
        return
      }
    }
    localStorage.setItem('k-light-current-session', JSON.stringify(newSession))
    // Redirect to root without user param to let App.js handle the session
    window.location.href = '/'
  }

  const createNewSession = () => {
    const name = prompt('Nom de la nouvelle session:')
    if (!name) return
    const password = prompt('Mot de passe (laisser vide si aucun):')
    const newSession = { 
      name, 
      password: password || null,
      created_at: new Date().toISOString() 
    }
    const sessions = [...availableSessions, newSession]
    localStorage.setItem('k-light-sessions', JSON.stringify(sessions))
    setAvailableSessions(sessions)
    switchSession(newSession)
  }

  // Load forecasts from backend
  const loadForecasts = async () => {
    if (!userId) return
    try {
      const sessionParam = sessionId ? `?sessionId=${sessionId}` : ''
      const r = await fetch(`/api/forecasts/${userId}${sessionParam}`)
      const d = await r.json()
      setImportedForecasts(d.forecasts || [])
    } catch (e) { console.error('Error loading forecasts:', e) }
  }

  // Save forecasts to backend
  const saveForecasts = async (forecasts) => {
    if (!userId) return
    try {
      await fetch(`/api/forecasts/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forecasts, sessionId })
      })
    } catch (e) { console.error('Error saving forecasts:', e) }
  }

  // Wrapper to update state AND save to backend
  const updateForecasts = (newForecasts) => {
    setImportedForecasts(newForecasts)
    saveForecasts(newForecasts)
  }

  const loadCategoryRules = async () => {
    try {
      const sessionParam = sessionId ? `?sessionId=${sessionId}` : ''
      const r = await fetch('/api/category-rules' + sessionParam)
      if (r.ok) { const { rules } = await r.json(); setCategoryRules(rules) }
    } catch (e) { console.error('Failed to load rules:', e) }
  }

  const generateRulesAI = async () => {
    setGeneratingRules(true)
    try {
      const sessionParam = sessionId ? `?sessionId=${sessionId}` : ''
      const r = await fetch('/api/category-rules/generate/' + userId + sessionParam, { method: 'POST' })
      if (r.ok) { 
        const { rules } = await r.json()
        setCategoryRules(rules)
        // Also recategorize transactions with new rules
        await fetch('/api/recategorize/' + userId + sessionParam, { method: 'POST' })
        loadData() // Reload to see new categories
      }
      else alert('Error generating rules')
    } catch (e) { alert(e.message) }
    setGeneratingRules(false)
  }

  const addRule = async () => {
    if (!newRuleCategory || !newRuleKeywords) return
    try {
      const r = await fetch('/api/category-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newRuleCategory, keywords: newRuleKeywords, sessionId })
      })
      if (r.ok) { const { rules } = await r.json(); setCategoryRules(rules); setNewRuleCategory(''); setNewRuleKeywords('') }
    } catch (e) { alert(e.message) }
  }

  const updateRule = async (id, keywords, category) => {
    try {
      const r = await fetch('/api/category-rules/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, category, sessionId })
      })
      if (r.ok) { const { rules } = await r.json(); setCategoryRules(rules); setEditingRule(null) }
    } catch (e) { alert(e.message) }
  }

  const deleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return
    try {
      const sessionParam = sessionId ? `?sessionId=${sessionId}` : ''
      const r = await fetch('/api/category-rules/' + id + sessionParam, { method: 'DELETE' })
      if (r.ok) { const { rules } = await r.json(); setCategoryRules(rules) }
    } catch (e) { alert(e.message) }
  }

  const resetRules = async () => {
    if (!confirm('Reset to default rules?')) return
    try {
      const r = await fetch('/api/category-rules/reset', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      if (r.ok) { const { rules } = await r.json(); setCategoryRules(rules) }
    } catch (e) { alert(e.message) }
  }

  const recategorizeAll = async () => {
    try {
      const sessionParam = sessionId ? `?sessionId=${sessionId}` : ''
      const r = await fetch('/api/recategorize/' + userId + sessionParam, { method: 'POST' })
      if (r.ok) { const { recategorized } = await r.json(); alert('Recategorized ' + recategorized + ' transactions'); loadData() }
    } catch (e) { alert(e.message) }
  }

  // Fetch real FX rates from Frankfurter API
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const currencies = new Set()
        fxPairs.forEach(pair => { const [c1, c2] = pair.split('/'); currencies.add(c1); currencies.add(c2) })
        currencies.add(consolCcy)
        const targets = [...currencies].filter(c => c !== 'EUR').join(',')
        if (!targets) return
        const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=' + targets)
        if (res.ok) {
          const json = await res.json()
          const rates = { 'EUR/EUR': 1 }
          Object.entries(json.rates).forEach(([k, v]) => { rates['EUR/' + k] = v; rates[k + '/EUR'] = 1 / v })
          Object.keys(json.rates).forEach(c1 => {
            Object.keys(json.rates).forEach(c2 => {
              if (c1 !== c2) rates[c1 + '/' + c2] = json.rates[c2] / json.rates[c1]
            })
          })
          setRealRates(rates)
          console.log('📈 FX rates loaded:', rates)
        }
      } catch (e) { console.error('FX fetch error:', e) }
    }
    fetchRates()
    const interval = setInterval(fetchRates, 60000)
    return () => clearInterval(interval)
  }, [fxPairs, consolCcy])

  // FX Ticker with real rates + small variations
  useEffect(() => {
    if (Object.keys(realRates).length === 0) return
    const initial = {}
    fxPairs.forEach(p => { const base = realRates[p] || 1; initial[p] = { rate: base, prev: base, change: 0 } })
    setFxTicker(initial)
    const interval = setInterval(() => {
      setFxTicker(prev => {
        const updated = { ...prev }
        const flashes = {}
        let anyUpdate = false
        fxPairs.filter(() => Math.random() > 0.5).forEach(p => {
          const baseRate = realRates[p] || prev[p]?.rate || 1
          const variation = (Math.random() - 0.5) * 0.0005 * baseRate
          const currentRate = updated[p]?.rate || baseRate
          const newRate = Math.max(baseRate * 0.995, Math.min(baseRate * 1.005, currentRate + variation))
          flashes[p] = variation > 0 ? 'up' : 'down'
          updated[p] = { rate: newRate, prev: currentRate, change: variation }
          anyUpdate = true
        })
        if (anyUpdate) { setFxFlash(flashes); setTimeout(() => { setFxFlash({}) }, 300) }
        return updated
      })
    }, 800)
    return () => clearInterval(interval)
  }, [fxPairs, realRates])

  const addFxPair = () => { if (newFxCcy1 !== newFxCcy2 && !fxPairs.includes(newFxCcy1 + '/' + newFxCcy2)) { setFxPairs([...fxPairs, newFxCcy1 + '/' + newFxCcy2]) } setShowAddFx(false) }
  const removeFxPair = (pair) => setFxPairs(fxPairs.filter(p => p !== pair))

  const loadData = async () => {
    setLoading(true)
    try {
      // ✅ Pass sessionId to filter data for this session only
      const sessionParam = sessionId ? `?sessionId=${sessionId}` : ''
      const dashR = await fetch('/api/dashboard/' + userId + sessionParam)
      if (dashR.ok) {
        const dashData = await dashR.json()
        console.log('📊 Dashboard data loaded:', dashData.accounts?.length, 'accounts,', dashData.transactions?.length, 'tx')
        setData(dashData)
      } else {
        console.error('❌ Failed to load dashboard:', await dashR.text())
        setError('Failed to load dashboard data')
      }
      
      // Try to load forecast if endpoint exists
      const [r2, r3] = await Promise.all([
        fetch('/api/forecast/' + userId + '?days=30' + (sessionId ? `&sessionId=${sessionId}` : '')).catch(() => null),
        fetch('/api/categories-timeseries/' + userId + '?days=90' + (sessionId ? `&sessionId=${sessionId}` : '')).catch(() => null)
      ])
      if (r2?.ok) setForecast(await r2.json())
      if (r3?.ok) setCategoryTS(await r3.json())
    } catch (e) { 
      console.error('❌ Load error:', e)
      setError(e.message) 
    }
    setLoading(false)
  }

  const syncData = async () => { 
    console.log('🔄 Sync started for userId:', userId, 'sessionId:', sessionId)
    setSyncing(true)
    try {
      const sessionParam = sessionId ? `?sessionId=${sessionId}` : ''
      const response = await fetch('/api/sync/' + userId + sessionParam, { method: 'POST' })
      const result = await response.json()
      console.log('✅ Sync result:', result)
      await loadData()
    } catch (e) {
      console.error('❌ Sync error:', e)
    }
    setSyncing(false) 
  }
  
  // ✅ Pass sessionId when connecting a new bank
  const addBank = async () => { 
    const params = new URLSearchParams({ userId })
    if (sessionId) params.append('sessionId', sessionId)
    const r = await fetch('/api/auth/connect-url?' + params.toString())
    window.location.href = (await r.json()).url 
  }
  const loadAIForecast = async () => { setLoadingAI(true); try { const r = await fetch('/api/forecast-ai/' + userId, { method: 'POST' }); if (r.ok) { setAiForecast(await r.json()); setShowAIForecast(true) } } catch(e){} setLoadingAI(false) }

  const generateWidget = async () => {
    if (!widgetPrompt.trim()) return
    setGeneratingWidget(true)
    try {
      const r = await fetch('/api/generate-widget/' + userId, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ prompt: widgetPrompt, sessionId }) 
      })
      if (r.ok) { 
        const widget = await r.json()
        setWidgets([...widgets, { ...widget, id: Date.now(), prompt: widgetPrompt }])
        setWidgetPrompt('') 
      } else {
        const err = await r.json()
        alert(err.error || 'Error generating widget')
      }
    } catch (e) { alert(e.message) }
    setGeneratingWidget(false)
  }

  const handleFileDrop = async (e) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer?.files || e.target?.files || [])
    if (!files.length) return
    setProcessingFiles(true)
    const fd = new FormData(); files.forEach(f => fd.append('files', f))
    try {
      const r = await fetch('/api/parse-forecasts/' + userId, { method: 'POST', body: fd })
      if (r.ok) { const { forecasts } = await r.json(); updateForecasts([...importedForecasts, ...forecasts]) }
      else alert('Error: ' + (await r.json()).error)
    } catch (e) { alert(e.message) }
    setProcessingFiles(false)
  }

  const exportCSV = () => {
    if (!importedForecasts.length) return
    const csv = 'Transaction Date,Value Date,Amount,Currency,Note\n' + importedForecasts.map(f => f.transactionDate + ',' + f.valueDate + ',' + f.amount + ',' + f.currency + ',"' + (f.note||'').replace(/"/g,'""') + '"').join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'forecasts.csv'; a.click()
  }

  const groupCashFlow = (cfData, freq) => {
    if (!cfData || cfData.length === 0) return []
    const grouped = {}
    cfData.forEach(item => {
      const d = new Date(item.date)
      let key = item.date
      if (freq === 'weekly') { const s = new Date(d); s.setDate(d.getDate() - d.getDay() + 1); key = s.toISOString().split('T')[0] }
      else if (freq === 'monthly') { key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01' }
      if (!grouped[key]) grouped[key] = { date: key, inflow: 0, outflow: 0 }
      grouped[key].inflow += item.inflow || 0
      grouped[key].outflow += item.outflow || 0
    })
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  }

  const fmtConsol = v => v == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: consolCcy }).format(v)
  const fmtCcy = (v, c) => v == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c || 'EUR' }).format(v)
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: KYRIBA.navy }}><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: KYRIBA.lime }}></div></div>
  if (error || !data) return <div className="min-h-screen flex items-center justify-center" style={{ background: KYRIBA.navy }}><p style={{ color: KYRIBA.gray }}>{error || t.noData}</p></div>

  const { totalBalance = 0, totalInflow = 0, totalOutflow = 0, accounts = [], transactions = [], cashFlow = [], categories = [], fxRates = {} } = data
  const byCcy = accounts.reduce((a, x) => { const c = x.currency || 'EUR'; if (!a[c]) a[c] = { accounts: [], total: 0 }; a[c].accounts.push(x); a[c].total += x.balance || 0; return a }, {})
  const banks = new Set(accounts.map(a => a.bank_name || 'Unknown')).size

  // Helper function to calculate total flows in next 30 days
  const getFlowsD30 = () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const d30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const d30Str = d30.toISOString().split('T')[0]
    
    let total = 0
    for (let i = 0; i < importedForecasts.length; i++) {
      const f = importedForecasts[i]
      const dateStr = String(f.valueDate || f.transactionDate || f.date || '').split('T')[0]
      if (dateStr > todayStr && dateStr <= d30Str) {
        total += Number(f.amount) || 0
      }
    }
    return total
  }

  const getLiveBalance = () => {
    if (!accounts.length) return totalBalance
    return accounts.reduce((sum, acc) => {
      const bal = acc.balance || 0
      const ccy = acc.currency || 'EUR'
      if (ccy === consolCcy) return sum + bal
      const direct = consolCcy + '/' + ccy
      const inverse = ccy + '/' + consolCcy
      if (fxTicker[direct]?.rate) return sum + bal / fxTicker[direct].rate
      if (fxTicker[inverse]?.rate) return sum + bal * fxTicker[inverse].rate
      if (realRates[direct]) return sum + bal / realRates[direct]
      if (realRates[inverse]) return sum + bal * realRates[inverse]
      return sum + bal * (fxRates[ccy] || 1)
    }, 0)
  }

  const renderWidget = w => (
    <div key={w.id} className="rounded-xl p-5 relative group" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
      <button onClick={() => setWidgets(widgets.filter(x => x.id !== w.id))} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 transition-opacity"><X className="w-4 h-4" style={{ color: KYRIBA.danger }} /></button>
      <h4 className="font-medium mb-4" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{w.title}</h4>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {w.type === 'pie' ? (
            <PieChart>
              <Pie 
                data={w.chartData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={90} 
                innerRadius={40}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: darkMode ? KYRIBA.gray : '#888' }}
                style={{ fontSize: 11 }}
              >
                {w.chartData?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip 
                formatter={v => fmtConsol(v)}
                contentStyle={{ background: darkMode ? KYRIBA.navy : '#fff', border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#ccc') }} 
                itemStyle={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}
                labelStyle={{ color: darkMode ? KYRIBA.lime : KYRIBA.navy, fontWeight: 'bold' }}
              />
            </PieChart>
          ) : w.type === 'bar' ? (
            <BarChart data={w.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? KYRIBA.grayDark : '#e0e0e0'} />
              <XAxis dataKey="name" tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 11 }} />
              <YAxis tickFormatter={v => (v/1000).toFixed(0) + 'k'} tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 11 }} />
              <Tooltip formatter={v => fmtConsol(v)} contentStyle={{ background: darkMode ? KYRIBA.navy : '#fff', border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#ccc') }} itemStyle={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }} />
              <Bar dataKey="value" fill={KYRIBA.lime} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : w.type === 'line' ? (
            <LineChart data={w.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? KYRIBA.grayDark : '#e0e0e0'} />
              <XAxis dataKey="name" tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 11 }} />
              <YAxis tickFormatter={v => (v/1000).toFixed(0) + 'k'} tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 11 }} />
              <Tooltip formatter={v => fmtConsol(v)} contentStyle={{ background: darkMode ? KYRIBA.navy : '#fff', border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#ccc') }} itemStyle={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }} />
              <Line type="monotone" dataKey="value" stroke={KYRIBA.lime} strokeWidth={2.5} dot={{ fill: KYRIBA.lime, r: 4 }} />
            </LineChart>
          ) : (
            <AreaChart data={w.chartData}>
              <defs>
                <linearGradient id={`gradient-${w.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={KYRIBA.lime} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={KYRIBA.lime} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? KYRIBA.grayDark : '#e0e0e0'} />
              <XAxis dataKey="name" tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 11 }} />
              <YAxis tickFormatter={v => (v/1000).toFixed(0) + 'k'} tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 11 }} />
              <Tooltip formatter={v => fmtConsol(v)} contentStyle={{ background: darkMode ? KYRIBA.navy : '#fff', border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#ccc') }} itemStyle={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }} />
              <Area type="monotone" dataKey="value" fill={`url(#gradient-${w.id})`} stroke={KYRIBA.lime} strokeWidth={2} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      {w.prompt && <div className="text-xs mt-3 pt-3 truncate" style={{ color: darkMode ? KYRIBA.gray : '#888', borderTop: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#e0e0e0') }}>💬 "{w.prompt}"</div>}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: darkMode ? KYRIBA.navy : '#f5f5f5', minHeight: '100dvh' }}>
      {/* Header */}
      <header style={{ background: darkMode ? KYRIBA.navyLight : '#ffffff', borderBottom: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#e0e0e0') }}>
        <div className="container mx-auto px-3 sm:px-6 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: KYRIBA.lime }}>
                <span className="font-bold" style={{ color: KYRIBA.navy }}>K</span>
              </div>
              <span className="font-semibold hidden sm:inline" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>K-Light</span>
            </div>
            
            {/* Desktop: Tabs (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {[
                { id: 'connectbank', icon: Plus, label: 'connectBank', action: true },
                { id: 'categorization', icon: Tags, label: 'categorization' },
                { id: 'forecast', icon: Calendar, label: 'forecast' },
                { id: 'dashboard', icon: LayoutDashboard, label: 'dashboard' },
                { id: 'custom', icon: Wand2, label: 'custom' },
              ].map((tab, idx, arr) => (
                <div key={tab.id} className="flex items-center">
                  <button 
                    onClick={() => tab.action ? addBank() : setActiveTab(tab.id)} 
                    className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all active:scale-95"
                    style={{ 
                      background: activeTab === tab.id ? KYRIBA.lime : 'transparent', 
                      color: activeTab === tab.id ? KYRIBA.navy : (darkMode ? KYRIBA.gray : '#666')
                    }}
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold" style={{ 
                      background: activeTab === tab.id ? KYRIBA.navy : (darkMode ? KYRIBA.grayDark : '#e0e0e0'), 
                      color: activeTab === tab.id ? KYRIBA.lime : (darkMode ? KYRIBA.gray : '#666')
                    }}>{idx + 1}</span>
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{t[tab.label]}</span>
                  </button>
                  {idx < arr.length - 1 && <span className="mx-1 text-sm" style={{ color: darkMode ? KYRIBA.grayDark : '#ccc' }}>›</span>}
                </div>
              ))}
            </div>

            {/* Mobile: Current Tab + Hamburger Menu */}
            <div className="flex md:hidden items-center gap-2 flex-1 justify-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg active:scale-95"
                style={{ background: KYRIBA.lime, color: KYRIBA.navy }}
              >
                <Menu className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {activeTab === 'dashboard' ? t.dashboard : 
                   activeTab === 'categorization' ? t.categorization :
                   activeTab === 'forecast' ? t.forecast :
                   activeTab === 'custom' ? t.custom : 'Menu'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Right: Session, Settings, Sync */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Session Dropdown */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className="px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium flex items-center gap-1 active:scale-95"
                  style={{ background: darkMode ? KYRIBA.grayDark : '#e0e0e0', color: darkMode ? KYRIBA.white : KYRIBA.navy, minHeight: '36px' }}
                >
                  <span className="max-w-[50px] sm:max-w-[80px] truncate">{session?.name || 'Session'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showSessionDropdown && (
                  <div 
                    className="absolute right-0 top-full mt-1 min-w-[150px] rounded-lg shadow-lg z-50 overflow-hidden"
                    style={{ background: darkMode ? KYRIBA.navyLight : '#fff', border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#e0e0e0') }}
                  >
                    {availableSessions.filter(s => s.name !== session?.name).map(s => (
                      <button
                        key={s.name}
                        onClick={() => { setShowSessionDropdown(false); switchSession(s) }}
                        className="w-full px-4 py-3 text-left text-sm hover:opacity-80 transition-all"
                        style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy, background: darkMode ? KYRIBA.navyLight : '#fff' }}
                      >
                        {s.name}
                      </button>
                    ))}
                    <button
                      onClick={() => { setShowSessionDropdown(false); createNewSession() }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2"
                      style={{ color: KYRIBA.lime, borderTop: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#e0e0e0'), background: darkMode ? KYRIBA.navyLight : '#fff' }}
                    >
                      <Plus className="w-3 h-3" /> Nouvelle session
                    </button>
                    <button
                      onClick={() => { 
                        setShowSessionDropdown(false)
                        localStorage.removeItem('k-light-current-session')
                        window.location.href = '/'
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2"
                      style={{ color: KYRIBA.danger, borderTop: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#e0e0e0'), background: darkMode ? KYRIBA.navyLight : '#fff' }}
                    >
                      <LogOut className="w-3 h-3" /> Déconnexion
                    </button>
                  </div>
                )}
              </div>

              {/* Language - Hidden on mobile */}
              <select value={lang} onChange={e => setLang(e.target.value)} className="hidden sm:block px-2 py-1 rounded text-sm cursor-pointer" style={{ background: darkMode ? KYRIBA.navy : '#fff', color: darkMode ? KYRIBA.white : KYRIBA.navy, border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#ccc'), minHeight: '36px' }}>
                <option value="en">🇬🇧</option><option value="fr">🇫🇷</option>
              </select>

              {/* Dark Mode */}
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="p-2 rounded transition-all active:scale-95 hidden sm:flex"
                style={{ background: darkMode ? KYRIBA.grayDark : '#e0e0e0', color: darkMode ? KYRIBA.lime : KYRIBA.navy, minWidth: '36px', minHeight: '36px' }}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Sync */}
              <button onClick={syncData} disabled={syncing} className="px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm flex items-center gap-1 active:scale-95" style={{ background: KYRIBA.lime, color: KYRIBA.navy, minHeight: '36px' }}>
                <RefreshCw className={'w-4 h-4 ' + (syncing ? 'animate-spin' : '')} />
                <span className="hidden sm:inline">{t.sync}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden border-t"
            style={{ background: darkMode ? KYRIBA.navy : '#f5f5f5', borderColor: darkMode ? KYRIBA.grayDark : '#e0e0e0' }}
          >
            <div className="container mx-auto px-3 py-2 space-y-1">
              {[
                { id: 'connectbank', icon: Plus, label: 'connectBank', action: true, desc: 'Ajouter une banque' },
                { id: 'categorization', icon: Tags, label: 'categorization', desc: 'Règles de catégories' },
                { id: 'forecast', icon: Calendar, label: 'forecast', desc: 'Prévisions & imports' },
                { id: 'dashboard', icon: LayoutDashboard, label: 'dashboard', desc: 'Vue consolidée' },
                { id: 'custom', icon: Wand2, label: 'custom', desc: 'Widgets personnalisés' },
              ].map((tab, idx) => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    if (tab.action) addBank()
                    else setActiveTab(tab.id)
                  }} 
                  className="w-full px-4 py-3 rounded-lg flex items-center gap-3 active:scale-[0.98] transition-all"
                  style={{ 
                    background: activeTab === tab.id ? KYRIBA.lime : (darkMode ? KYRIBA.navyLight : '#fff'),
                    color: activeTab === tab.id ? KYRIBA.navy : (darkMode ? KYRIBA.white : KYRIBA.navy)
                  }}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ 
                    background: activeTab === tab.id ? KYRIBA.navy : (darkMode ? KYRIBA.grayDark : '#e0e0e0'), 
                    color: activeTab === tab.id ? KYRIBA.lime : (darkMode ? KYRIBA.gray : '#666')
                  }}>{idx + 1}</span>
                  <tab.icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">{t[tab.label]}</div>
                    <div className="text-xs opacity-60">{tab.desc}</div>
                  </div>
                </button>
              ))}
              
              {/* Mobile-only settings row */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t" style={{ borderColor: darkMode ? KYRIBA.grayDark : '#e0e0e0' }}>
                <div className="flex items-center gap-2">
                  <select value={lang} onChange={e => setLang(e.target.value)} className="px-3 py-2 rounded text-sm" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', color: darkMode ? KYRIBA.white : KYRIBA.navy, border: 'none' }}>
                    <option value="en">🇬🇧 English</option>
                    <option value="fr">🇫🇷 Français</option>
                  </select>
                </div>
                <button 
                  onClick={() => setDarkMode(!darkMode)} 
                  className="px-4 py-2 rounded flex items-center gap-2"
                  style={{ background: darkMode ? KYRIBA.grayDark : '#e0e0e0', color: darkMode ? KYRIBA.white : KYRIBA.navy }}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span className="text-sm">{darkMode ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* FX Ticker Bar - Collapsible, scrollable on mobile */}
      <div className="py-1 px-2 sm:px-4 flex items-center justify-between overflow-hidden" style={{ background: '#000', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-mono" style={{ color: '#00FF00' }}>LIVE</span>
        </div>
        {!fxCollapsed && (
          <div className="flex-1 overflow-x-auto scrollbar-hide mx-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
            {Object.entries(fxTicker).map(([pair, d]) => {
              const isUp = fxFlash[pair] === 'up'
              const isDown = fxFlash[pair] === 'down'
              const flashBg = isUp ? 'rgba(34,197,94,0.5)' : isDown ? 'rgba(239,68,68,0.5)' : 'transparent'
              const decimals = pair.includes('HUF') || pair.includes('JPY') ? 2 : 4
              return (
                <div key={pair} className="flex items-center gap-1 px-2 py-0.5 rounded transition-all duration-150 group" style={{ background: flashBg }}>
                  <span className="text-xs font-mono" style={{ color: '#666' }}>{pair}</span>
                  <span className="text-sm font-mono font-bold" style={{ color: isUp ? KYRIBA.success : isDown ? KYRIBA.danger : '#00FF00' }}>{d.rate?.toFixed(decimals)}</span>
                  <span className="text-xs font-mono" style={{ color: d.change >= 0 ? KYRIBA.success : KYRIBA.danger }}>{d.change >= 0 ? '▲' : '▼'}</span>
                  <button onClick={() => removeFxPair(pair)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: KYRIBA.danger }}><X className="w-3 h-3" /></button>
                </div>
              )
            })}
            {showAddFx ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: '#1a1a1a' }}>
                <select value={newFxCcy1} onChange={e => setNewFxCcy1(e.target.value)} className="text-xs font-mono bg-transparent border-none outline-none" style={{ color: '#00FF00' }}>
                  {ALL_CURRENCIES.map(c => <option key={c} value={c} style={{ background: '#000' }}>{c}</option>)}
                </select>
                <span style={{ color: '#666' }}>/</span>
                <select value={newFxCcy2} onChange={e => setNewFxCcy2(e.target.value)} className="text-xs font-mono bg-transparent border-none outline-none" style={{ color: '#00FF00' }}>
                  {ALL_CURRENCIES.map(c => <option key={c} value={c} style={{ background: '#000' }}>{c}</option>)}
                </select>
                <button onClick={addFxPair} className="ml-1 text-xs px-1.5 py-0.5 rounded" style={{ background: KYRIBA.success, color: '#000' }}>OK</button>
                <button onClick={() => setShowAddFx(false)} className="text-xs px-1 py-0.5" style={{ color: KYRIBA.danger }}>✕</button>
              </div>
            ) : (
              <button onClick={() => setShowAddFx(true)} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono" style={{ background: '#1a1a1a', color: KYRIBA.lime }}><Plus className="w-3 h-3" />ADD</button>
            )}
            <div className="flex items-center gap-2 px-3 py-0.5 rounded" style={{ background: '#1a1a1a', marginLeft: '8px' }}>
              <span className="text-xs font-mono" style={{ color: '#666' }}>CONSOL</span>
              <select value={consolCcy} onChange={e => setConsolCcy(e.target.value)} className="text-sm font-mono font-bold bg-transparent border-none outline-none cursor-pointer" style={{ color: KYRIBA.lime }}>
                {ALL_CURRENCIES.map(c => <option key={c} value={c} style={{ background: '#000', color: '#00FF00' }}>{c}</option>)}
              </select>
            </div>
            </div>
          </div>
        )}
        <button onClick={() => setFxCollapsed(!fxCollapsed)} className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0" style={{ color: '#666' }}>
          {fxCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Consolidated Balance - First, Bigger */}
              <div className='rounded-xl p-3 sm:p-5 transition-all duration-150' style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-xs sm:text-sm truncate" style={{ color: darkMode ? KYRIBA.gray : '#666' }}>{t.balance}</span>
                  <Building2 className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" style={{ color: KYRIBA.lime }} />
                </div>
                <div className='text-xl sm:text-3xl font-bold transition-all duration-150 truncate' style={{ color: darkMode ? KYRIBA.lime : '#059669' }}>{fmtConsol(getLiveBalance())}</div>
                <div className="text-xs mt-1 truncate" style={{ color: darkMode ? KYRIBA.gray : '#888' }}>{banks} {t.banks} • {accounts.length} {t.accounts}</div>
              </div>
              <div className="rounded-xl p-3 sm:p-5" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}><div className="flex items-center justify-between mb-1 sm:mb-2"><span className="text-xs sm:text-sm truncate" style={{ color: darkMode ? KYRIBA.gray : '#666' }}>{t.inflows} <span className="hidden sm:inline">{t.days90}</span></span><TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" style={{ color: KYRIBA.success }} /></div><div className="text-lg sm:text-2xl font-bold truncate" style={{ color: KYRIBA.success }}>+{fmtConsol(totalInflow)}</div></div>
              <div className="rounded-xl p-3 sm:p-5" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}><div className="flex items-center justify-between mb-1 sm:mb-2"><span className="text-xs sm:text-sm truncate" style={{ color: darkMode ? KYRIBA.gray : '#666' }}>{t.outflows} <span className="hidden sm:inline">{t.days90}</span></span><TrendingDown className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" style={{ color: KYRIBA.danger }} /></div><div className="text-lg sm:text-2xl font-bold truncate" style={{ color: KYRIBA.danger }}>-{fmtConsol(totalOutflow)}</div></div>
              <div className="rounded-xl p-3 sm:p-5" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-xs sm:text-sm truncate" style={{ color: darkMode ? KYRIBA.gray : '#666' }}>{t.flowsD30}</span>
                  <Calendar className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" style={{ color: darkMode ? KYRIBA.lime : '#059669' }} />
                </div>
                <div className="text-lg sm:text-2xl font-bold truncate" style={{ color: getFlowsD30() >= 0 ? KYRIBA.success : KYRIBA.danger }}>
                  {getFlowsD30() >= 0 ? '+' : ''}{fmtConsol(getFlowsD30())}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="rounded-xl p-3 sm:p-5" style={{ background: darkMode ? KYRIBA.navyLight : '#fff' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                  <h3 className="font-medium flex items-center gap-2 text-sm sm:text-base" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{t.cashForecast}{importedForecasts.length > 0 && <span className="text-xs px-2 py-0.5 rounded" style={{ background: KYRIBA.lime, color: KYRIBA.navy }}>+{importedForecasts.length}</span>}</h3>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs overflow-x-auto">
                    <div className="flex items-center gap-1 flex-shrink-0"><div className="w-3 h-0.5" style={{ background: KYRIBA.lime }}></div><span style={{ color: darkMode ? KYRIBA.gray : '#666' }}>{lang === 'fr' ? 'Réalisé' : 'Actual'}</span></div>
                    <div className="flex items-center gap-1 flex-shrink-0"><div className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#3B82F6' }}></div><span style={{ color: darkMode ? KYRIBA.gray : '#666' }}>{lang === 'fr' ? 'Prévision' : 'Forecast'}</span></div>
                  </div>
                </div>
                <div className="h-48 sm:h-64">{transactions.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={(() => {
                    const today = new Date()
                    const todayStr = today.toISOString().split('T')[0]
                    
                    // Generate all dates from -60 to +60 days
                    const allDates = []
                    for (let i = -60; i <= 60; i++) {
                      const d = new Date(today)
                      d.setDate(d.getDate() + i)
                      allDates.push(d.toISOString().split('T')[0])
                    }
                    
                    // Build daily net changes from transactions
                    const txByDate = {}
                    transactions.forEach(tx => {
                      const d = tx.date?.split('T')[0]
                      if (d) {
                        if (!txByDate[d]) txByDate[d] = 0
                        txByDate[d] += tx.amountEUR || 0
                      }
                    })
                    
                    // Build imported forecasts by date
                    const impByDate = {}
                    importedForecasts.forEach(f => {
                      const d = (f.valueDate || f.transactionDate || '').split('T')[0]
                      if (d) {
                        if (!impByDate[d]) impByDate[d] = 0
                        impByDate[d] += f.amount || 0
                      }
                    })
                    
                    // Calculate historical balances going backwards from today
                    const historicalBalances = {}
                    let bal = totalBalance
                    const pastDates = allDates.filter(d => d <= todayStr).sort().reverse()
                    pastDates.forEach((d, idx) => {
                      if (idx === 0) {
                        historicalBalances[d] = bal // Today
                      } else {
                        // Previous day = current - that day's transactions
                        const prevDate = pastDates[idx - 1]
                        bal = bal - (txByDate[prevDate] || 0)
                        historicalBalances[d] = bal
                      }
                    })
                    
                    // Calculate forecast balances going forward from today
                    const forecastBalances = {}
                    let fbal = totalBalance
                    const futureDates = allDates.filter(d => d >= todayStr).sort()
                    futureDates.forEach((d, idx) => {
                      if (idx === 0) {
                        forecastBalances[d] = fbal // Today
                      } else {
                        fbal = fbal + (impByDate[d] || 0)
                        forecastBalances[d] = fbal
                      }
                    })
                    
                    // Build chart data
                    const chartData = allDates.map(d => ({
                      date: d,
                      actual: d <= todayStr ? Math.round((historicalBalances[d] || totalBalance) * 100) / 100 : null,
                      forecast: d >= todayStr ? Math.round((forecastBalances[d] || totalBalance) * 100) / 100 : null
                    }))
                    
                    // Find min balance for marker
                    const allBalances = chartData.map(d => d.actual ?? d.forecast).filter(v => v !== null)
                    const minBal = Math.min(...allBalances)
                    return chartData.map(d => ({
                      ...d,
                      minBalance: (d.actual === minBal || d.forecast === minBal) ? minBal : null
                    }))
                  })()}>
                    <defs>
                      <linearGradient id="pastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={KYRIBA.lime} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={KYRIBA.lime} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="futureGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? KYRIBA.grayDark : '#e0e0e0'} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 10 }} axisLine={{ stroke: darkMode ? KYRIBA.grayDark : '#ccc' }} interval={14} />
                    <YAxis domain={['auto', 'auto']} tickFormatter={v => (v/1000).toFixed(0) + 'k'} tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(v, name) => {
                        if (name === 'minBalance' || v === null) return null
                        const label = name === 'actual' ? (lang === 'fr' ? 'Réalisé' : 'Actual') : (lang === 'fr' ? 'Prévision' : 'Forecast')
                        return [fmtConsol(v), label]
                      }}
                      contentStyle={{ background: darkMode ? KYRIBA.navy : '#fff', border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#ccc'), borderRadius: '8px' }}
                      labelStyle={{ color: KYRIBA.lime, fontWeight: 'bold' }}
                      itemStyle={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}
                      labelFormatter={d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    />
                    <ReferenceLine x={new Date().toISOString().split('T')[0]} stroke={darkMode ? KYRIBA.grayDark : '#ccc'} strokeWidth={1} strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="actual" fill="url(#pastGradient)" stroke="none" connectNulls={false} tooltipType="none" />
                    <Area type="monotone" dataKey="forecast" fill="url(#futureGradient)" stroke="none" connectNulls={false} tooltipType="none" />
                    <Line type="monotone" dataKey="actual" stroke={KYRIBA.lime} strokeWidth={2.5} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="forecast" stroke="#3B82F6" strokeWidth={2.5} strokeDasharray="8 4" dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="minBalance" stroke={KYRIBA.danger} strokeWidth={0} dot={{ r: 6, fill: KYRIBA.danger, stroke: darkMode ? KYRIBA.navy : '#fff', strokeWidth: 2 }} tooltipType="none" />
                  </ComposedChart>
                </ResponsiveContainer> : <div className="h-full flex items-center justify-center" style={{ color: KYRIBA.gray }}>{t.noData}</div>}</div>
                {/* Summary stats below chart - calculated from actual data */}
                {(() => {
                  // Calculate forecast balances for indicators
                  const today = new Date()
                  const todayStr = today.toISOString().split('T')[0]
                  
                  // Build imported forecasts by date
                  const impByDate = {}
                  importedForecasts.forEach(f => {
                    const d = (f.valueDate || f.transactionDate || '').split('T')[0]
                    if (d && d > todayStr) {
                      if (!impByDate[d]) impByDate[d] = 0
                      impByDate[d] += f.amount || 0
                    }
                  })
                  
                  // Calculate future balances
                  let minBalance = totalBalance
                  let endBalance = totalBalance
                  const futureDates = Object.keys(impByDate).sort()
                  let runningBalance = totalBalance
                  
                  // Calculate for next 60 days
                  for (let i = 1; i <= 60; i++) {
                    const d = new Date(today)
                    d.setDate(d.getDate() + i)
                    const dateStr = d.toISOString().split('T')[0]
                    runningBalance += (impByDate[dateStr] || 0)
                    if (runningBalance < minBalance) minBalance = runningBalance
                    if (i === 30) endBalance = runningBalance // D+30
                  }
                  
                  // If no forecasts, endBalance stays as totalBalance
                  if (importedForecasts.length === 0) {
                    minBalance = totalBalance
                    endBalance = totalBalance
                  }
                  
                  return (
                    <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#e0e0e0') }}>
                      <div className="text-center">
                        <div className="text-xs" style={{ color: darkMode ? KYRIBA.gray : '#888' }}>Today</div>
                        <div className="text-sm font-bold" style={{ color: darkMode ? KYRIBA.lime : '#059669' }}>{fmtConsol(totalBalance)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs" style={{ color: darkMode ? KYRIBA.gray : '#888' }}>Min (60d)</div>
                        <div className="text-sm font-bold" style={{ color: KYRIBA.danger }}>{fmtConsol(minBalance)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs" style={{ color: darkMode ? KYRIBA.gray : '#888' }}>D+30</div>
                        <div className="text-sm font-bold" style={{ color: '#3B82F6' }}>{fmtConsol(endBalance)}</div>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="rounded-xl p-3 sm:p-5" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="font-medium text-sm sm:text-base" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{lang === 'fr' ? 'Flux' : 'Flows'}</h3>
                  <div className="flex gap-1 text-xs">
                    {['daily', 'weekly', 'monthly'].map(f => (
                      <button key={f} onClick={() => setCashFlowFreq(f)} className="px-2 py-1 rounded active:scale-95" style={{ background: cashFlowFreq === f ? KYRIBA.lime : (darkMode ? KYRIBA.navy : '#e0e0e0'), color: cashFlowFreq === f ? KYRIBA.navy : (darkMode ? KYRIBA.gray : '#666'), minHeight: '28px' }}>
                        {f === 'daily' ? 'D' : f === 'weekly' ? 'W' : 'M'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Dual range slider with independent handles */}
                <div className="mb-4 pt-5">
                  {/* Timeline labels */}
                  <div className="flex justify-between text-xs mb-2 px-1" style={{ color: darkMode ? KYRIBA.gray : '#888' }}>
                    <span>-1Y</span>
                    <span>-6M</span>
                    <span>-3M</span>
                    <span style={{ color: KYRIBA.white, fontWeight: 'bold' }}>TODAY</span>
                    <span>+3M</span>
                    <span>+6M</span>
                  </div>
                  <div className="relative h-6">
                    {/* Background track */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 rounded-full" style={{ background: KYRIBA.grayDark }} />
                    {/* Active range fill */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full"
                      style={{ 
                        left: `${((cashFlowRange[0] + 365) / 545) * 100}%`,
                        width: `${((cashFlowRange[1] - cashFlowRange[0]) / 545) * 100}%`,
                        background: `linear-gradient(to right, ${KYRIBA.lime}, #3B82F6)`
                      }}
                    />
                    {/* Today marker */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded"
                      style={{ left: `${(365 / 545) * 100}%`, background: KYRIBA.white, transform: 'translateX(-50%) translateY(-50%)' }}
                    />
                    {/* Left handle - clickable area on left half */}
                    <input
                      type="range"
                      min={-365}
                      max={180}
                      step={7}
                      value={cashFlowRange[0]}
                      onChange={e => {
                        const val = parseInt(e.target.value)
                        if (val < cashFlowRange[1]) setCashFlowRange([val, cashFlowRange[1]])
                      }}
                      className="absolute top-0 h-full appearance-none bg-transparent cursor-pointer"
                      style={{ 
                        left: 0, 
                        width: `${((cashFlowRange[0] + cashFlowRange[1]) / 2 + 365) / 545 * 100}%`,
                        zIndex: 20
                      }}
                    />
                    {/* Right handle - clickable area on right half */}
                    <input
                      type="range"
                      min={-365}
                      max={180}
                      step={7}
                      value={cashFlowRange[1]}
                      onChange={e => {
                        const val = parseInt(e.target.value)
                        if (val > cashFlowRange[0]) setCashFlowRange([cashFlowRange[0], val])
                      }}
                      className="absolute top-0 h-full appearance-none bg-transparent cursor-pointer"
                      style={{ 
                        left: `${((cashFlowRange[0] + cashFlowRange[1]) / 2 + 365) / 545 * 100}%`,
                        width: `${100 - ((cashFlowRange[0] + cashFlowRange[1]) / 2 + 365) / 545 * 100}%`,
                        zIndex: 20
                      }}
                    />
                    {/* Visual handle left */}
                    <div 
                      className="absolute top-1/2 w-5 h-5 rounded-full border-3 pointer-events-none"
                      style={{ 
                        left: `${((cashFlowRange[0] + 365) / 545) * 100}%`, 
                        transform: 'translateX(-50%) translateY(-50%)',
                        background: KYRIBA.lime,
                        border: `3px solid ${KYRIBA.navy}`,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}
                    />
                    {/* Visual handle right */}
                    <div 
                      className="absolute top-1/2 w-5 h-5 rounded-full border-3 pointer-events-none"
                      style={{ 
                        left: `${((cashFlowRange[1] + 365) / 545) * 100}%`, 
                        transform: 'translateX(-50%) translateY(-50%)',
                        background: '#3B82F6',
                        border: `3px solid ${KYRIBA.navy}`,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}
                    />
                    <style>{`
                      input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: transparent;
                        cursor: grab;
                      }
                      input[type="range"]::-webkit-slider-thumb:active { cursor: grabbing; }
                      input[type="range"]::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: transparent;
                        border: none;
                        cursor: grab;
                      }
                    `}</style>
                  </div>
                  {/* Selected range display */}
                  <div className="flex justify-between mt-2 text-xs font-mono">
                    <span style={{ color: KYRIBA.lime }}>{cashFlowRange[0]}d</span>
                    <span style={{ color: '#3B82F6' }}>+{cashFlowRange[1]}d</span>
                  </div>
                </div>
                <div className="h-48">{(cashFlow.length > 0 || importedForecasts.length > 0) ? <ResponsiveContainer width="100%" height="100%"><BarChart data={(() => {
                  const today = new Date()
                  const todayStr = today.toISOString().split('T')[0]
                  const startDate = new Date(today); startDate.setDate(startDate.getDate() + cashFlowRange[0])
                  const endDate = new Date(today); endDate.setDate(endDate.getDate() + cashFlowRange[1])
                  const startDateStr = startDate.toISOString().split('T')[0]
                  const endDateStr = endDate.toISOString().split('T')[0]
                  
                  // Past data from cashFlow - filter by start date AND today
                  const pastData = cashFlow.filter(cf => {
                    const dateStr = cf.date?.split('T')[0]
                    return dateStr >= startDateStr && dateStr <= todayStr
                  }).map(cf => ({
                    date: cf.date,
                    inflow: cf.inflow || 0,
                    outflow: -(cf.outflow || 0) // Make negative for chart
                  }))
                  
                  // Future data from imported forecasts - filter by today AND end date
                  const futureByDate = {}
                  importedForecasts.forEach(f => {
                    const dateStr = (f.valueDate || f.transactionDate || '').split('T')[0]
                    if (dateStr && dateStr > todayStr && dateStr <= endDateStr) {
                      if (!futureByDate[dateStr]) futureByDate[dateStr] = { date: dateStr, inflow: 0, outflow: 0 }
                      if (f.amount >= 0) {
                        futureByDate[dateStr].inflow += f.amount
                      } else {
                        futureByDate[dateStr].outflow += f.amount // Already negative
                      }
                    }
                  })
                  
                  const combined = [...pastData, ...Object.values(futureByDate)].sort((a, b) => a.date.localeCompare(b.date))
                  return groupCashFlow(combined, cashFlowFreq)
                })()}><CartesianGrid strokeDasharray="3 3" stroke={KYRIBA.grayDark} vertical={false} /><XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: KYRIBA.gray, fontSize: 10 }} interval="preserveStartEnd" /><YAxis tickFormatter={v => Math.round(v/1000) + 'k'} tick={{ fill: KYRIBA.gray, fontSize: 11 }} /><Tooltip formatter={v => fmtConsol(Math.abs(v))} contentStyle={{ background: KYRIBA.navy, border: '1px solid ' + KYRIBA.lime, borderRadius: '8px' }} /><ReferenceLine y={0} stroke={KYRIBA.grayDark} /><Bar dataKey="inflow" fill={KYRIBA.success} radius={[2, 2, 0, 0]} /><Bar dataKey="outflow" fill={KYRIBA.danger} radius={[0, 0, 2, 2]} /></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center" style={{ color: KYRIBA.gray }}>{t.noData}</div>}</div>
              </div>
            </div>

            {categoryTS?.timeseries?.length > 0 && (
              <div className="rounded-xl p-5 mb-6" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{t.categoryHistory}</h3>
                  <div className="flex gap-2">
                    <button onClick={loadAIForecast} disabled={loadingAI} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm" style={{ background: KYRIBA.lime, color: KYRIBA.navy }}><Sparkles className={'w-4 h-4 ' + (loadingAI ? 'animate-pulse' : '')} />{loadingAI ? t.aiAnalysis : t.expandAI}</button>
                    <button onClick={() => setExpandedCategories(!expandedCategories)} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm" style={{ background: darkMode ? KYRIBA.navy : '#e0e0e0', color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{expandedCategories ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}{expandedCategories ? t.consolidate : t.detail}</button>
                  </div>
                </div>
                {aiForecast?.insights && showAIForecast && <div className="rounded-lg p-3 mb-4" style={{ background: darkMode ? KYRIBA.navy : '#f0fdf4', borderLeft: '3px solid ' + KYRIBA.lime }}><p className="text-sm" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{aiForecast.insights}</p></div>}
                {!expandedCategories ? (
                  <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={showAIForecast && aiForecast ? [...categoryTS.timeseries, ...aiForecast.forecast] : categoryTS.timeseries}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? KYRIBA.grayDark : '#e0e0e0'} />
                      <XAxis dataKey="week" tickFormatter={fmtDate} tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 11 }} />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        tickFormatter={v => (v/1000).toFixed(0) + 'k'} 
                        tick={{ fill: darkMode ? KYRIBA.gray : '#666', fontSize: 11 }} 
                      />
                      <Tooltip 
                        formatter={(v, n) => [fmtConsol(v), n]} 
                        contentStyle={{ background: darkMode ? KYRIBA.navy : '#fff', border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#ccc') }}
                        itemStyle={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}
                      />
                      <ReferenceLine y={0} stroke={darkMode ? KYRIBA.gray : '#888'} strokeWidth={2} />
                      {/* Income categories (positive) - stacked above zero */}
                      {categoryTS.categories.filter(c => c.includes('Revenu') || c.includes('Income') || c.includes('Salaire') || c.includes('💰')).map((c, i) => (
                        <Area 
                          key={c} 
                          type="monotone" 
                          dataKey={c} 
                          stackId="income"
                          fill={KYRIBA.success} 
                          stroke={KYRIBA.success} 
                          fillOpacity={0.7} 
                        />
                      ))}
                      {/* Expense categories (negative) - stacked below zero */}
                      {categoryTS.categories.filter(c => !c.includes('Revenu') && !c.includes('Income') && !c.includes('Salaire') && !c.includes('💰')).slice(0, 6).map((c, i) => (
                        <Area 
                          key={c} 
                          type="monotone" 
                          dataKey={c} 
                          stackId="expense"
                          fill={COLORS[i % COLORS.length]} 
                          stroke={COLORS[i % COLORS.length]} 
                          fillOpacity={0.6} 
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{categoryTS.categories.slice(0, 8).map((c, i) => { const d = categoryTS.categoryTimeseries[c] || []; const total = d.reduce((s, x) => s + x.amount, 0); const isPositive = total >= 0; return <div key={c} className="rounded-lg p-3" style={{ background: darkMode ? KYRIBA.navy : '#f5f5f5' }}><div className="flex justify-between mb-2"><span className="text-xs truncate" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{c}</span><span className="text-xs" style={{ color: isPositive ? KYRIBA.success : (darkMode ? KYRIBA.lime : '#059669') }}>{fmtConsol(total)}</span></div><div className="h-16"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d}><Area type="monotone" dataKey="amount" fill={COLORS[i % COLORS.length]} fillOpacity={0.3} stroke={COLORS[i % COLORS.length]} /><ReferenceLine y={0} stroke={darkMode ? KYRIBA.grayDark : '#ccc'} /></AreaChart></ResponsiveContainer></div></div> })}</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl p-3 sm:p-5" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{t.categories}</h3>
                {categories.length > 0 ? (<><div className="h-32 sm:h-40"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories.slice(0, 6)} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>{categories.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={v => fmtConsol(v)} contentStyle={{ background: darkMode ? KYRIBA.navy : '#fff', border: '1px solid ' + (darkMode ? KYRIBA.grayDark : '#ccc') }} itemStyle={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }} labelStyle={{ color: darkMode ? KYRIBA.lime : KYRIBA.navy, fontWeight: 'bold' }} /></PieChart></ResponsiveContainer></div><div className="space-y-1.5 mt-3">{categories.slice(0, 5).map((c, i) => <div key={c.category} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2 min-w-0"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div><span className="truncate" style={{ color: darkMode ? KYRIBA.gray : '#666' }}>{c.category}</span></div><span className="flex-shrink-0 ml-2" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{fmtConsol(c.total)}</span></div>)}</div></>) : <div className="h-32 sm:h-40 flex items-center justify-center" style={{ color: KYRIBA.gray }}>{t.noData}</div>}
              </div>
              <div className="rounded-xl p-3 sm:p-5" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4"><h3 className="font-medium text-sm sm:text-base" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{t.allAccounts}</h3><div className="flex gap-1 text-xs">{['bank', 'currency', 'account'].map(g => <button key={g} onClick={() => setGroupBy(g)} className="px-2 py-1 rounded active:scale-95" style={{ background: groupBy === g ? KYRIBA.lime : (darkMode ? KYRIBA.navy : '#e0e0e0'), color: groupBy === g ? KYRIBA.navy : (darkMode ? KYRIBA.gray : '#666'), minHeight: '28px' }}>{t['by' + g.charAt(0).toUpperCase() + g.slice(1)]}</button>)}</div></div>
                <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {groupBy === 'bank' && Object.entries(accounts.reduce((a, x) => { const b = x.bank_name || 'Unknown'; if (!a[b]) a[b] = []; a[b].push(x); return a }, {})).map(([b, accs]) => <div key={b} className="rounded-lg p-2" style={{ background: darkMode ? KYRIBA.navy : '#f5f5f5' }}><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><Building2 className="w-3 h-3" style={{ color: darkMode ? KYRIBA.lime : '#059669' }} /><span className="text-xs font-medium" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{getBankName(b)}</span></div><span className="text-xs font-medium" style={{ color: darkMode ? KYRIBA.lime : '#059669' }}>{fmtConsol(accs.reduce((s, a) => s + (a.balance || 0) * (fxRates[a.currency] || 1), 0))}</span></div>{accs.map(a => <div key={a.id} className="flex justify-between text-xs pl-5 py-0.5" style={{ color: darkMode ? KYRIBA.gray : '#666' }}><span className="truncate max-w-[120px]">{a.name}</span><span>{fmtCcy(a.balance, a.currency)}</span></div>)}</div>)}
                  {groupBy === 'currency' && Object.entries(byCcy).map(([c, d]) => <div key={c} className="rounded-lg p-2" style={{ background: darkMode ? KYRIBA.navy : '#f5f5f5' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{(CURRENCY_INFO[c] || {}).flag || '💰'} {c}</span><span className="text-xs font-medium" style={{ color: darkMode ? KYRIBA.lime : '#059669' }}>{fmtCcy(d.total, c)}</span></div>{d.accounts.map(a => <div key={a.id} className="flex justify-between text-xs pl-5 py-0.5" style={{ color: darkMode ? KYRIBA.gray : '#666' }}><span className="truncate max-w-[120px]">{a.name}</span><span>{fmtCcy(a.balance, c)}</span></div>)}</div>)}
                  {groupBy === 'account' && accounts.map(a => <div key={a.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: darkMode ? KYRIBA.navy : '#f5f5f5' }}><div className="flex items-center gap-2"><span className="text-xs">{(CURRENCY_INFO[a.currency] || {}).flag || '💰'}</span><div><div className="text-xs font-medium" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{a.name}</div><div className="text-xs" style={{ color: darkMode ? KYRIBA.gray : '#888' }}>{getBankName(a.bank_name)}</div></div></div><div className="text-xs font-medium" style={{ color: darkMode ? KYRIBA.lime : '#059669' }}>{fmtCcy(a.balance, a.currency)}</div></div>)}
                </div>
              </div>
              <div className="rounded-xl p-3 sm:p-5" style={{ background: darkMode ? KYRIBA.navyLight : '#fff', boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="font-medium text-sm sm:text-base" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{t.transactions}</h3>
                  <span className="text-xs px-2 py-0.5 rounded self-start sm:self-auto" style={{ background: darkMode ? KYRIBA.navy : '#e0e0e0', color: darkMode ? KYRIBA.gray : '#666' }}>{transactions.filter(tx => !txSearch || tx.description?.toLowerCase().includes(txSearch.toLowerCase()) || tx.category?.toLowerCase().includes(txSearch.toLowerCase())).length}</span>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: darkMode ? KYRIBA.gray : '#888' }} />
                  <input 
                    type="text" 
                    value={txSearch} 
                    onChange={e => setTxSearch(e.target.value)} 
                    placeholder="Search transactions..." 
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border-none outline-none" 
                    style={{ background: darkMode ? KYRIBA.navy : '#f5f5f5', color: darkMode ? KYRIBA.white : KYRIBA.navy }} 
                  />
                  {txSearch && <button onClick={() => setTxSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10"><X className="w-3 h-3" style={{ color: darkMode ? KYRIBA.gray : '#888' }} /></button>}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.length > 0 ? transactions
                    .filter(tx => !txSearch || tx.description?.toLowerCase().includes(txSearch.toLowerCase()) || tx.category?.toLowerCase().includes(txSearch.toLowerCase()))
                    .slice(0, 20)
                    .map(tx => <div key={tx.id} className="flex justify-between py-1.5 border-b" style={{ borderColor: darkMode ? KYRIBA.grayDark : '#e0e0e0' }}><div className="flex-1 min-w-0"><div className="text-xs font-medium truncate" style={{ color: darkMode ? KYRIBA.white : KYRIBA.navy }}>{tx.description}</div><div className="text-xs" style={{ color: darkMode ? KYRIBA.gray : '#888' }}>{fmtDate(tx.date)} • {tx.category}</div></div><div className="text-xs font-medium" style={{ color: tx.amountEUR >= 0 ? KYRIBA.success : (darkMode ? KYRIBA.white : KYRIBA.navy) }}>{tx.amountEUR >= 0 ? '+' : ''}{fmtConsol(tx.amountEUR)}</div></div>) : <div className="text-center py-8" style={{ color: KYRIBA.gray }}>{t.noData}</div>}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'custom' && (
          <div>
            <div className="rounded-xl p-5 mb-6" style={{ background: KYRIBA.navyLight }}>
              <h3 className="font-medium mb-4 flex items-center gap-2" style={{ color: KYRIBA.white }}><Wand2 className="w-5 h-5" style={{ color: KYRIBA.lime }} />{t.createWidget}</h3>
              <div className="flex gap-3">
                <input type="text" value={widgetPrompt} onChange={e => setWidgetPrompt(e.target.value)} placeholder={t.widgetPrompt} className="flex-1 px-4 py-2 rounded-lg text-sm border-none outline-none" style={{ background: KYRIBA.navy, color: KYRIBA.white }} onKeyDown={e => e.key === 'Enter' && generateWidget()} />
                <button onClick={generateWidget} disabled={generatingWidget || !widgetPrompt.trim()} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50" style={{ background: KYRIBA.lime, color: KYRIBA.navy }}><Sparkles className={'w-4 h-4 ' + (generatingWidget ? 'animate-pulse' : '')} />{generatingWidget ? t.generating : t.addWidget}</button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: KYRIBA.white }}>{t.myWidgets}</h3>
              {widgets.length > 0 && <button onClick={() => { if(confirm('Clear all widgets?')) setWidgets([]) }} className="px-3 py-1.5 rounded text-xs flex items-center gap-1.5" style={{ background: KYRIBA.navy, color: KYRIBA.danger }}><Trash2 className="w-3.5 h-3.5" />{t.clearAll}</button>}
            </div>
            {widgets.length > 0 ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{widgets.map(renderWidget)}</div> : <div className="rounded-xl p-12 text-center" style={{ background: darkMode ? KYRIBA.navyLight : '#fff' }}><Wand2 className="w-12 h-12 mx-auto mb-4" style={{ color: KYRIBA.grayDark }} /><p style={{ color: KYRIBA.gray }}>{t.noWidgets}</p></div>}
          </div>
        )}

        {activeTab === 'forecast' && (
          <div>
            {/* Two columns: Import files + Manual entry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Import files */}
              <div className={'rounded-xl p-4 sm:p-6 border-2 border-dashed cursor-pointer ' + (dragOver ? 'border-solid' : '')} style={{ background: KYRIBA.navyLight, borderColor: dragOver ? KYRIBA.lime : KYRIBA.grayDark }} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop} onClick={() => document.getElementById('file-input').click()}>
                <input id="file-input" type="file" multiple accept=".pdf,.xlsx,.xls,.csv" className="hidden" onChange={handleFileDrop} />
                <div className="text-center">
                  {processingFiles ? <><div className="animate-spin rounded-full h-8 sm:h-10 w-8 sm:w-10 border-b-2 mx-auto mb-3" style={{ borderColor: KYRIBA.lime }}></div><p style={{ color: KYRIBA.lime }}>{t.processing}</p></> : <><Upload className="w-8 sm:w-10 h-8 sm:h-10 mx-auto mb-3" style={{ color: dragOver ? KYRIBA.lime : KYRIBA.gray }} /><p className="text-sm font-medium mb-1" style={{ color: KYRIBA.white }}>{t.importFiles}</p><p className="text-xs" style={{ color: KYRIBA.gray }}>{t.dropFiles}</p></>}
                </div>
              </div>
              
              {/* Manual entry form */}
              <div className="rounded-xl p-3 sm:p-5" style={{ background: KYRIBA.navyLight }}>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: KYRIBA.gray }}>{t.valDate}</label>
                    <input type="date" id="manual-date" className="w-full px-3 py-2 rounded text-sm" style={{ background: KYRIBA.navy, color: KYRIBA.white, border: 'none', minHeight: '44px', fontSize: '16px' }} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: KYRIBA.gray }}>{t.amount}</label>
                    <input type="text" inputMode="decimal" id="manual-amount" placeholder="-1000" autoComplete="off" className="w-full px-3 py-2 rounded text-sm" style={{ background: KYRIBA.navy, color: KYRIBA.white, border: 'none', minHeight: '44px', fontSize: '16px' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
                  <div className="col-span-1">
                    <label className="text-xs mb-1 block" style={{ color: KYRIBA.gray }}>{t.currency}</label>
                    <select id="manual-ccy" className="w-full px-2 sm:px-3 py-2 rounded text-sm" style={{ background: KYRIBA.navy, color: KYRIBA.white, border: 'none', minHeight: '44px', fontSize: '16px' }}>
                      {ALL_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-xs mb-1 block" style={{ color: KYRIBA.gray }}>{t.note}</label>
                    <input type="text" id="manual-note" placeholder="Description..." autoComplete="off" className="w-full px-3 py-2 rounded text-sm" style={{ background: KYRIBA.navy, color: KYRIBA.white, border: 'none', minHeight: '44px', fontSize: '16px' }} />
                  </div>
                </div>
                {/* Recurring option */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 p-2 sm:p-3 rounded" style={{ background: KYRIBA.navy }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="manual-recurring" className="w-5 h-5 rounded" style={{ accentColor: KYRIBA.lime }} />
                    <span className="text-sm" style={{ color: KYRIBA.white }}>Recurring</span>
                  </label>
                  <select id="manual-frequency" className="px-2 sm:px-3 py-1.5 rounded text-sm" style={{ background: KYRIBA.navyLight, color: KYRIBA.gray, border: 'none', minHeight: '36px' }}>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: KYRIBA.gray }}>×</span>
                    <input type="number" id="manual-occurrences" defaultValue="12" min="1" max="60" className="w-14 sm:w-16 px-2 py-1.5 rounded text-sm text-center" style={{ background: KYRIBA.navyLight, color: KYRIBA.white, border: 'none', minHeight: '36px' }} />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const dateStr = document.getElementById('manual-date').value
                    const amount = parseFloat(document.getElementById('manual-amount').value)
                    const ccy = document.getElementById('manual-ccy').value
                    const note = document.getElementById('manual-note').value
                    const isRecurring = document.getElementById('manual-recurring').checked
                    const frequency = document.getElementById('manual-frequency').value
                    const occurrences = parseInt(document.getElementById('manual-occurrences').value) || 1
                    
                    if (dateStr && !isNaN(amount)) {
                      const newForecasts = []
                      let currentDate = new Date(dateStr)
                      const count = isRecurring ? occurrences : 1
                      
                      for (let i = 0; i < count; i++) {
                        newForecasts.push({
                          transactionDate: currentDate.toISOString().split('T')[0],
                          valueDate: currentDate.toISOString().split('T')[0],
                          amount,
                          currency: ccy || 'EUR',
                          note: isRecurring ? `${note} (${i + 1}/${count})` : note,
                          sourceFile: 'Manual'
                        })
                        
                        // Advance date based on frequency
                        if (frequency === 'weekly') currentDate.setDate(currentDate.getDate() + 7)
                        else if (frequency === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1)
                        else if (frequency === 'quarterly') currentDate.setMonth(currentDate.getMonth() + 3)
                        else if (frequency === 'yearly') currentDate.setFullYear(currentDate.getFullYear() + 1)
                      }
                      
                      updateForecasts([...importedForecasts, ...newForecasts])
                      document.getElementById('manual-date').value = ''
                      document.getElementById('manual-amount').value = ''
                      document.getElementById('manual-note').value = ''
                      document.getElementById('manual-recurring').checked = false
                    }
                  }}
                  className="w-full py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: KYRIBA.lime, color: KYRIBA.navy }}
                >
                  <Plus className="w-4 h-4" />{t.addManually}
                </button>
              </div>
            </div>
            
            {/* Forecasts table */}
            <div className="rounded-xl p-5" style={{ background: KYRIBA.navyLight }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center gap-2" style={{ color: KYRIBA.white }}><FileText className="w-5 h-5" style={{ color: KYRIBA.lime }} />{t.forecastTable}{importedForecasts.length > 0 && <span className="text-xs px-2 py-0.5 rounded" style={{ background: KYRIBA.lime, color: KYRIBA.navy }}>{importedForecasts.length}</span>}</h3>
                {importedForecasts.length > 0 && <div className="flex gap-2"><button onClick={exportCSV} className="px-3 py-1.5 rounded text-xs flex items-center gap-1.5" style={{ background: KYRIBA.navy, color: KYRIBA.lime }}><Download className="w-3.5 h-3.5" />{t.exportCSV}</button><button onClick={() => updateForecasts([])} className="px-3 py-1.5 rounded text-xs flex items-center gap-1.5" style={{ background: KYRIBA.navy, color: KYRIBA.danger }}><Trash2 className="w-3.5 h-3.5" />{t.clearAll}</button></div>}
              </div>
              {importedForecasts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ borderBottom: '1px solid ' + KYRIBA.grayDark }}><th className="text-left py-2 px-3 font-medium" style={{ color: KYRIBA.gray }}>{t.valDate}</th><th className="text-right py-2 px-3 font-medium" style={{ color: KYRIBA.gray }}>{t.amount}</th><th className="text-center py-2 px-3 font-medium" style={{ color: KYRIBA.gray }}>{t.currency}</th><th className="text-left py-2 px-3 font-medium" style={{ color: KYRIBA.gray }}>{t.note}</th><th className="text-left py-2 px-3 font-medium" style={{ color: KYRIBA.gray }}>Source</th><th className="w-10"></th></tr></thead>
                    <tbody>{importedForecasts.sort((a, b) => (a.valueDate || a.transactionDate || '').localeCompare(b.valueDate || b.transactionDate || '')).map((f, i) => <tr key={f.id || i} className="hover:bg-white/5" style={{ borderBottom: '1px solid ' + KYRIBA.grayDark }}><td className="py-2 px-3" style={{ color: KYRIBA.white }}>{f.valueDate || f.transactionDate}</td><td className="py-2 px-3 text-right font-mono" style={{ color: f.amount >= 0 ? KYRIBA.success : KYRIBA.danger }}>{f.amount >= 0 ? '+' : ''}{f.amount?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td><td className="py-2 px-3 text-center" style={{ color: KYRIBA.gray }}>{f.currency}</td><td className="py-2 px-3 max-w-xs truncate" style={{ color: KYRIBA.gray }} title={f.note}>{f.note}</td><td className="py-2 px-3 text-xs" style={{ color: f.sourceFile === 'Manual' ? KYRIBA.lime : KYRIBA.gray }}>{f.sourceFile || '—'}</td><td className="py-2 px-1"><button onClick={() => updateForecasts(importedForecasts.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-500/20"><X className="w-3.5 h-3.5" style={{ color: KYRIBA.danger }} /></button></td></tr>)}</tbody>
                  </table>
                </div>
              ) : <div className="text-center py-12"><Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: KYRIBA.grayDark }} /><p style={{ color: KYRIBA.gray }}>{t.noForecasts}</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'categorization' && (
          <div>
            {/* Header with actions */}
            <div className="rounded-xl p-3 sm:p-5 mb-4 sm:mb-6" style={{ background: KYRIBA.navyLight }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-medium flex items-center gap-2 text-sm sm:text-base" style={{ color: KYRIBA.white }}><Tags className="w-5 h-5" style={{ color: KYRIBA.lime }} />{t.categoryRules}<span className="text-xs px-2 py-0.5 rounded" style={{ background: KYRIBA.lime, color: KYRIBA.navy }}>{categoryRules.length}</span></h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={generateRulesAI} disabled={generatingRules} className="px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm flex items-center gap-1.5 active:scale-95" style={{ background: KYRIBA.lime, color: KYRIBA.navy, minHeight: '36px' }}><Sparkles className={'w-4 h-4 ' + (generatingRules ? 'animate-pulse' : '')} /><span className="hidden sm:inline">{generatingRules ? t.generatingRules : t.generateAI}</span><span className="sm:hidden">AI</span></button>
                  <button onClick={recategorizeAll} className="px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm flex items-center gap-1.5 active:scale-95" style={{ background: KYRIBA.navy, color: KYRIBA.white, minHeight: '36px' }}><RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">{t.recategorize}</span></button>
                  <button onClick={resetRules} className="px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm flex items-center gap-1.5 active:scale-95" style={{ background: KYRIBA.navy, color: KYRIBA.danger, minHeight: '36px' }}><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">{t.resetRules}</span></button>
                </div>
              </div>
              
              {/* Add new rule */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input type="text" value={newRuleCategory} onChange={e => setNewRuleCategory(e.target.value)} placeholder="🏷️ Category" className="sm:w-48 px-3 py-2 rounded-lg text-sm border-none outline-none" style={{ background: KYRIBA.navy, color: KYRIBA.white, minHeight: '44px', fontSize: '16px' }} />
                <input type="text" value={newRuleKeywords} onChange={e => setNewRuleKeywords(e.target.value)} placeholder="Keywords (comma separated)" className="flex-1 px-3 py-2 rounded-lg text-sm border-none outline-none" style={{ background: KYRIBA.navy, color: KYRIBA.white, minHeight: '44px', fontSize: '16px' }} onKeyDown={e => e.key === 'Enter' && addRule()} />
                <button onClick={addRule} disabled={!newRuleCategory || !newRuleKeywords} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95" style={{ background: KYRIBA.lime, color: KYRIBA.navy, minHeight: '44px' }}><Plus className="w-4 h-4" />{t.addRule}</button>
              </div>
            </div>

            {/* Rules list */}
            <div className="rounded-xl p-3 sm:p-5" style={{ background: KYRIBA.navyLight }}>
              {categoryRules.length > 0 ? (
                <div className="space-y-2">
                  {categoryRules.map(rule => (
                    <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg group" style={{ background: KYRIBA.navy }}>
                      {editingRule === rule.id ? (
                        <>
                          <input type="text" defaultValue={rule.category} id={'cat-' + rule.id} className="sm:w-48 px-2 py-2 rounded text-sm border-none outline-none" style={{ background: KYRIBA.navyLight, color: KYRIBA.white, minHeight: '40px', fontSize: '16px' }} />
                          <input type="text" defaultValue={rule.keywords.join(', ')} id={'kw-' + rule.id} className="flex-1 px-2 py-2 rounded text-sm border-none outline-none" style={{ background: KYRIBA.navyLight, color: KYRIBA.white, minHeight: '40px', fontSize: '16px' }} />
                          <div className="flex gap-2">
                            <button onClick={() => updateRule(rule.id, document.getElementById('kw-' + rule.id).value, document.getElementById('cat-' + rule.id).value)} className="p-2 rounded active:scale-95" style={{ background: KYRIBA.success, minWidth: '40px', minHeight: '40px' }}><Check className="w-4 h-4" style={{ color: '#000' }} /></button>
                            <button onClick={() => setEditingRule(null)} className="p-2 rounded active:scale-95" style={{ background: KYRIBA.danger, minWidth: '40px', minHeight: '40px' }}><X className="w-4 h-4" style={{ color: '#fff' }} /></button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="sm:w-48 text-sm font-medium" style={{ color: KYRIBA.lime }}>{rule.category}</span>
                          <span className="flex-1 text-xs line-clamp-2 sm:line-clamp-1" style={{ color: KYRIBA.gray }}>{rule.keywords.join(', ')}</span>
                          <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingRule(rule.id)} className="p-2 rounded active:scale-95" style={{ background: KYRIBA.navyLight, minWidth: '36px', minHeight: '36px' }}><Edit2 className="w-3.5 h-3.5" style={{ color: KYRIBA.white }} /></button>
                            <button onClick={() => deleteRule(rule.id)} className="p-2 rounded hover:bg-red-500/20 active:scale-95" style={{ minWidth: '36px', minHeight: '36px' }}><Trash2 className="w-3.5 h-3.5" style={{ color: KYRIBA.danger }} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Tags className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-4" style={{ color: KYRIBA.grayDark }} />
                  <p style={{ color: KYRIBA.gray }}>{t.noRules}</p>
                  <button onClick={generateRulesAI} className="mt-4 px-4 py-2 rounded-lg text-sm active:scale-95" style={{ background: KYRIBA.lime, color: KYRIBA.navy, minHeight: '44px' }}>{t.generateAI}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
