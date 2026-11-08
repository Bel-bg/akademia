const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  defaultState,
  levelFromXp,
  normalizeFiliere,
  normalizeState,
  themeForFiliere,
  computeBattleScores,
  getBattleWeekBounds,
} = require('./progressionService');

const DB_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, originalHash] = stored.split(':');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

function createInitialDb() {
  return {
    users: {},
    sessions: {},
    battleHistory: [],
  };
}

let dbCache = null;

function loadDb() {
  if (dbCache) return dbCache;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      const initial = createInitialDb();
      dbCache = {
        users: raw.users || initial.users,
        sessions: raw.sessions || initial.sessions,
        battleHistory: Array.isArray(raw.battleHistory) ? raw.battleHistory : [],
      };
      return dbCache;
    }
  } catch {
    /* fallback to initial DB */
  }
  dbCache = createInitialDb();
  saveDb(dbCache);
  return dbCache;
}

function saveDb(db = dbCache) {
  if (!db) return;
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function isConfigured() {
  return true;
}

function sanitizeUser(user) {
  const filiere = normalizeFiliere(user.state?.filiere ?? user.filiere);
  const theme = themeForFiliere(filiere);
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    filiere,
    theme,
  };
}

function findUserByEmail(db, email) {
  const target = String(email || '').trim().toLowerCase();
  return Object.values(db.users).find((u) => u.email.toLowerCase() === target) || null;
}

function findUserByUsername(db, username, excludeUserId = null) {
  const target = String(username || '').trim().toLowerCase();
  return (
    Object.values(db.users).find(
      (u) => u.id !== excludeUserId && u.username.trim().toLowerCase() === target,
    ) || null
  );
}

async function signUpUser({ email, password, username, filiere }) {
  const db = loadDb();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '');

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    const err = new Error('Adresse e-mail invalide.');
    err.status = 400;
    throw err;
  }
  if (cleanPassword.length < 6) {
    const err = new Error('Le mot de passe doit contenir au moins 6 caractères.');
    err.status = 400;
    throw err;
  }
  if (!/^[\w.\- À-ÿ]{3,24}$/.test(cleanUsername)) {
    const err = new Error('Pseudo invalide (3 à 24 caractères).');
    err.status = 400;
    throw err;
  }
  if (findUserByEmail(db, cleanEmail)) {
    const err = new Error('Cet e-mail est déjà utilisé.');
    err.status = 409;
    throw err;
  }
  if (findUserByUsername(db, cleanUsername)) {
    const err = new Error('Ce pseudo est déjà pris. Choisis-en un autre.');
    err.status = 409;
    throw err;
  }

  const normFiliere = normalizeFiliere(filiere);
  const now = new Date().toISOString();
  const id = `u-${crypto.randomUUID()}`;
  const state = normalizeState({
    ...defaultState(),
    filiere: normFiliere,
    theme: themeForFiliere(normFiliere),
  });

  const user = {
    id,
    email: cleanEmail,
    username: cleanUsername,
    passwordHash: hashPassword(cleanPassword),
    filiere: normFiliere,
    xp: 0,
    level: 1,
    streak: 0,
    createdAt: now,
    updatedAt: now,
    state,
  };

  const token = crypto.randomBytes(32).toString('hex');
  db.users[id] = user;
  db.sessions[token] = { userId: id, createdAt: now };
  saveDb(db);

  return {
    token,
    user: sanitizeUser(user),
    state: user.state,
  };
}

async function signInUser({ email, password }) {
  const db = loadDb();
  const user = findUserByEmail(db, email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    const err = new Error('E-mail ou mot de passe incorrect.');
    err.status = 401;
    throw err;
  }

  user.state = normalizeState(user.state);
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
  saveDb(db);

  return {
    token,
    user: sanitizeUser(user),
    state: user.state,
  };
}

async function signOutUser(accessToken) {
  const db = loadDb();
  if (accessToken && db.sessions[accessToken]) {
    delete db.sessions[accessToken];
    saveDb(db);
  }
}

async function resetUserPassword({ email, newPassword }) {
  const db = loadDb();
  const user = findUserByEmail(db, email);
  if (!user) {
    const err = new Error('Aucun compte trouvé avec cette adresse e-mail.');
    err.status = 404;
    throw err;
  }
  const pass = String(newPassword || 'akademia123');
  if (pass.length < 6) {
    const err = new Error('Le mot de passe doit contenir au moins 6 caractères.');
    err.status = 400;
    throw err;
  }
  user.passwordHash = hashPassword(pass);
  user.updatedAt = new Date().toISOString();
  saveDb(db);
  return { ok: true };
}

async function verifyAccessToken(accessToken) {
  const db = loadDb();
  const session = db.sessions[accessToken];
  if (!session) return null;
  const user = db.users[session.userId];
  if (!user) return null;
  return sanitizeUser(user);
}

async function loadProgress(_accessToken, userId) {
  const db = loadDb();
  const user = db.users[userId];
  if (!user) return null;
  user.state = normalizeState(user.state);
  return user.state;
}

async function saveProgress(_accessToken, userId, state) {
  const db = loadDb();
  const user = db.users[userId];
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.status = 404;
    throw err;
  }
  const existingFiliere = normalizeFiliere(user.filiere || user.state?.filiere);
  const normalized = normalizeState(state);
  if (existingFiliere) {
    normalized.filiere = existingFiliere;
    normalized.theme = themeForFiliere(existingFiliere);
  }
  user.state = normalized;
  user.filiere = normalized.filiere;
  user.xp = normalized.xp;
  user.level = levelFromXp(normalized.xp);
  user.streak = normalized.streak;
  user.updatedAt = new Date().toISOString();
  saveDb(db);
  return normalized;
}

async function getProfile(_accessToken, userId) {
  const db = loadDb();
  const user = db.users[userId];
  if (!user) return null;
  return sanitizeUser(user);
}

async function updateProfile(_accessToken, userId, { username, filiere }) {
  const db = loadDb();
  const user = db.users[userId];
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.status = 404;
    throw err;
  }

  if (typeof username === 'string' && username.trim()) {
    const clean = username.trim();
    if (!/^[\w.\- ·À-ÿ]{3,28}$/.test(clean)) {
      const err = new Error('Pseudo invalide (3 à 24 caractères).');
      err.status = 400;
      throw err;
    }
    if (findUserByUsername(db, clean, userId)) {
      const err = new Error('Ce pseudo est déjà pris.');
      err.status = 409;
      throw err;
    }
    user.username = clean;
  }

  if (filiere !== undefined) {
    const norm = normalizeFiliere(filiere);
    if (!norm) {
      const err = new Error('Filière invalide (ARI ou AIP attendu).');
      err.status = 400;
      throw err;
    }
    const currentFiliere = normalizeFiliere(user.filiere || user.state?.filiere);
    if (currentFiliere && currentFiliere !== norm) {
      const err = new Error('La filière ne peut plus être modifiée une fois choisie.');
      err.status = 400;
      throw err;
    }
    user.filiere = norm;
    user.state = normalizeState({ ...user.state, filiere: norm, theme: themeForFiliere(norm) });
  }

  user.updatedAt = new Date().toISOString();
  saveDb(db);
  return {
    user: sanitizeUser(user),
    state: user.state,
  };
}

async function getLeaderboard(_accessToken, limit = 50) {
  const db = loadDb();
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
  return Object.values(db.users)
    .map((u) => {
      const filiere = normalizeFiliere(u.state?.filiere ?? u.filiere) || 'ARI';
      const xp = u.state?.xp ?? u.xp ?? 0;
      const streak = u.state?.streak ?? u.streak ?? 0;
      return {
        id: u.id,
        username: u.username,
        filiere,
        xp,
        level: levelFromXp(xp),
        streak,
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .slice(0, safeLimit);
}

function getBattleData(referenceDate = new Date()) {
  const db = loadDb();
  if (!Array.isArray(db.battleHistory)) {
    db.battleHistory = [];
  }
  const currentBattle = computeBattleScores(db.users, referenceDate);

  if (currentBattle.isFinished) {
    const existingIdx = db.battleHistory.findIndex((b) => b.id === currentBattle.id);
    const historyItem = {
      id: currentBattle.id,
      weekLabel: currentBattle.weekLabel,
      startsAt: currentBattle.startsAt,
      endsAt: currentBattle.endsAt,
      ariScore: currentBattle.ariScore,
      aipScore: currentBattle.aipScore,
      ariMembers: currentBattle.ariMembers,
      aipMembers: currentBattle.aipMembers,
      winner: currentBattle.winner,
      status: 'completed',
    };
    if (existingIdx >= 0) {
      db.battleHistory[existingIdx] = historyItem;
    } else {
      db.battleHistory.unshift(historyItem);
      saveDb(db);
    }
  }

  return {
    currentBattle,
    history: db.battleHistory,
  };
}

async function getFeed(_userId) {
  return getBattleData();
}

async function togglePostLike(_userId, postId) {
  return { id: postId, likes: 0, liked: false };
}

async function addPostComment(_userId, _postId, _text) {
  return { id: `c-${crypto.randomUUID()}`, author: '', filiere: 'ARI', text: '', at: 'À l’instant' };
}

async function voteBattle(_userId, _campInput) {
  const battle = getBattleData();
  return {
    AIP: battle.currentBattle.aipScore,
    ARI: battle.currentBattle.ariScore,
    userVote: null,
  };
}

async function insertMessage(_accessToken, senderId, recipientId, body) {
  const db = loadDb();
  if (!Array.isArray(db.messages)) db.messages = [];
  const msg = {
    id: crypto.randomUUID(),
    sender_id: senderId,
    recipient_id: recipientId,
    body,
    created_at: new Date().toISOString(),
  };
  db.messages.push(msg);
  saveDb(db);
  return msg;
}

async function deleteMessageForParticipants(_accessToken, userId, messageId) {
  const db = loadDb();
  if (!Array.isArray(db.messages)) return 0;
  const initialLen = db.messages.length;
  db.messages = db.messages.filter(
    (m) => !(m.id === messageId && (m.sender_id === userId || m.recipient_id === userId)),
  );
  saveDb(db);
  return initialLen - db.messages.length;
}

async function deleteConversationForParticipants(_accessToken, userId, partnerId) {
  const db = loadDb();
  if (!Array.isArray(db.messages)) return 0;
  const initialLen = db.messages.length;
  db.messages = db.messages.filter(
    (m) =>
      !(
        (m.sender_id === userId && m.recipient_id === partnerId) ||
        (m.sender_id === partnerId && m.recipient_id === userId)
      ),
  );
  saveDb(db);
  return initialLen - db.messages.length;
}

async function getActionReceipt(_accessToken, userId, actionId) {
  const db = loadDb();
  return db.actionReceipts?.[`${userId}:${actionId}`] ?? null;
}

async function saveActionReceipt(_accessToken, userId, actionId, result) {
  const db = loadDb();
  if (!db.actionReceipts) db.actionReceipts = {};
  db.actionReceipts[`${userId}:${actionId}`] = result;
  saveDb(db);
}

function overtakenPlayerIds(before, after, userId) {
  if (!Array.isArray(before) || !Array.isArray(after)) return [];
  const oldRank = before.findIndex((player) => player.id === userId);
  const newRank = after.findIndex((player) => player.id === userId);
  if (oldRank < 0 || newRank < 0 || newRank >= oldRank) return [];
  return before.slice(newRank, oldRank).map((player) => player.id);
}

async function readResponse(response) {
  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`Supabase request failed (${response.status})`);
    error.status = response.status >= 500 ? 502 : response.status;
    throw error;
  }
  if (!body.trim()) return null;
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('Supabase returned an invalid response');
    error.status = 502;
    throw error;
  }
}

module.exports = {
  addPostComment,
  deleteConversationForParticipants,
  deleteMessageForParticipants,
  getActionReceipt,
  getBattleData,
  getFeed,
  getLeaderboard,
  getProfile,
  insertMessage,
  isConfigured,
  loadProgress,
  overtakenPlayerIds,
  readResponse,
  resetUserPassword,
  saveActionReceipt,
  saveProgress,
  signInUser,
  signOutUser,
  signUpUser,
  togglePostLike,
  updateProfile,
  verifyAccessToken,
  voteBattle,
};
