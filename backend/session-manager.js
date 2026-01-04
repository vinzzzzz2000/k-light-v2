/**
 * Session Manager - Gère la session unique fusionnée
 */

import fs from 'fs';

const SESSION_FILE = './session.json';
const DATA_FILE = './data.json';

let currentSession = null;

/**
 * Charge les données brutes
 */
function loadRawData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('Error loading raw data:', e);
    return { users: [], accounts: [], transactions: [] };
  }
}

/**
 * Crée un mapping compte -> object complet
 */
function createAccountMapping(accounts) {
  const mapping = {};
  accounts.forEach(account => {
    mapping[account.powens_account_id] = account;
  });
  return mapping;
}

/**
 * Enrichit une transaction avec données du compte
 */
function enrichTransaction(transaction, accountMapping) {
  const account = accountMapping[transaction.powens_account_id];
  if (!account) return transaction;
  
  return {
    ...transaction,
    account_name: account.name,
    account_type: account.type,
    account_currency: account.currency
  };
}

/**
 * Enrichit un user avec ses accounts et transactions
 */
function enrichUser(user, accounts, transactions, accountMapping) {
  const userAccounts = accounts.filter(acc => acc.powens_user_id === user.powens_user_id);
  
  const userTransactions = transactions
    .filter(tx => tx.powens_user_id === user.powens_user_id)
    .map(tx => enrichTransaction(tx, accountMapping));
  
  const balanceByDivisa = {};
  userAccounts.forEach(acc => {
    if (!balanceByDivisa[acc.currency]) {
      balanceByDivisa[acc.currency] = 0;
    }
    balanceByDivisa[acc.currency] += acc.balance;
  });
  
  return {
    ...user,
    accounts: userAccounts,
    transactions: userTransactions,
    balance_by_currency: balanceByDivisa,
    total_accounts: userAccounts.length,
    total_transactions: userTransactions.length
  };
}

/**
 * Fusionne les données en une session unique
 */
function mergeData(rawData) {
  const { users, accounts, transactions } = rawData;
  
  const accountMapping = createAccountMapping(accounts);
  
  const mergedUsers = users.map(user => 
    enrichUser(user, accounts, transactions, accountMapping)
  );
  
  // Calculer balance totale
  const totalBalance = {};
  mergedUsers.forEach(user => {
    Object.entries(user.balance_by_currency || {}).forEach(([currency, balance]) => {
      if (!totalBalance[currency]) totalBalance[currency] = 0;
      totalBalance[currency] += balance;
    });
  });
  
  return {
    session_id: `session_${Date.now()}`,
    created_at: new Date().toISOString(),
    stats: {
      total_users: mergedUsers.length,
      total_accounts: accounts.length,
      total_transactions: transactions.length,
      total_balance: totalBalance
    },
    users: mergedUsers
  };
}

/**
 * Sauve la session en fichier (optionnel, juste pour debug)
 */
function saveSession(session) {
  // Commenté: on génère toujours depuis data.json
  // fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

/**
 * Initialise la session au démarrage
 */
export function initializeSession() {
  console.log('📊 Initialisation de la session fusionnée...');
  
  const rawData = loadRawData();
  currentSession = mergeData(rawData);
  saveSession(currentSession);
  
  console.log(`✅ Session créée: ${currentSession.session_id}`);
  console.log(`   Users: ${currentSession.stats.total_users}`);
  console.log(`   Accounts: ${currentSession.stats.total_accounts}`);
  console.log(`   Transactions: ${currentSession.stats.total_transactions}`);
  
  return currentSession;
}

/**
 * Retourne la session actuelle
 */
export function getSession() {
  if (!currentSession) {
    initializeSession();
  }
  return currentSession;
}

/**
 * Retourne les données pour un user spécifique
 * FIX: Cherche par id OU powens_user_id
 */
export function getUserData(userId) {
  const session = getSession();
  const numericUserId = parseInt(userId);
  
  // Chercher par id numérique OU par powens_user_id string
  return session.users.find(u => 
    u.id === numericUserId || 
    u.powens_user_id === userId ||
    u.powens_user_id === String(userId)
  );
}

/**
 * Retourne les accounts d'un user
 */
export function getUserAccounts(userId) {
  const user = getUserData(userId);
  return user ? user.accounts : [];
}

/**
 * Retourne les transactions d'un user
 */
export function getUserTransactions(userId) {
  const user = getUserData(userId);
  return user ? user.transactions : [];
}

/**
 * Retourne les stats globales
 */
export function getStats() {
  const session = getSession();
  return session.stats;
}

/**
 * Recharge la session (utile après une sync)
 */
export function reloadSession() {
  console.log('♻️ Rechargement de la session...');
  currentSession = null;
  return initializeSession();
}
