const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AsyncLocalStorage } = require('node:async_hooks');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../frontend/.env') });

const {
  defaultState,
  levelFromXp,
  normalizeFiliere,
  normalizeState,
  themeForFiliere,
  computeBattleScores,
} = require('./progressionService');

const DB_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const requestContext = new AsyncLocalStorage();
let cachedRuntimeSupabaseUrl = null;
let cachedRuntimeSupabaseAnonKey = null;

function isValidSupabaseUrl(url) {
  return (
    typeof url === 'string' &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url.trim().replace(/\/+$/, '')) &&
    !url.includes('VOTRE-PROJET')
  );
}

function getSupabaseConfig() {
  const envUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const envAnonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim() || null;

  if (isValidSupabaseUrl(envUrl) && envAnonKey) {
    return { url: envUrl, anonKey: envAnonKey, serviceRoleKey };
  }

  const store = requestContext.getStore();
  if (store?.supabaseUrl && store?.supabaseAnonKey) {
    return {
      url: store.supabaseUrl,
      anonKey: store.supabaseAnonKey,
      serviceRoleKey,
    };
  }

  if (cachedRuntimeSupabaseUrl && cachedRuntimeSupabaseAnonKey) {
    return {
      url: cachedRuntimeSupabaseUrl,
      anonKey: cachedRuntimeSupabaseAnonKey,
      serviceRoleKey,
    };
  }

  return null;
}

function runWithRequestContext(headers, fn) {
  const rawUrl = String(headers?.['x-supabase-url'] || '')
    .trim()
    .replace(/\/+$/, '');
  const rawKey = String(headers?.['x-supabase-anon-key'] || '').trim();
  if (isValidSupabaseUrl(rawUrl) && rawKey.length > 20) {
    cachedRuntimeSupabaseUrl = rawUrl;
    cachedRuntimeSupabaseAnonKey = rawKey;
    return requestContext.run({ supabaseUrl: rawUrl, supabaseAnonKey: rawKey }, fn);
  }
  return fn();
}

function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

function isConfigured() {
  return true;
}

function translateAuthError(msg = '') {
  const m = String(msg).toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'E-mail ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('already exists'))
    return 'Cet e-mail est déjà utilisé.';
  if (m.includes('password should be'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('email not confirmed'))
    return 'Confirme ton e-mail (lien reçu par courriel) avant de te connecter.';
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (m.includes('username') || m.includes('profiles'))
    return 'Ce pseudo est déjà pris. Choisis-en un autre.';
  return msg || 'Opération impossible.';
}

async function readResponse(response) {
  const body = await response.text();
  if (!response.ok) {
    let detail = '';
    try {
      const parsed = JSON.parse(body);
      detail = parsed?.msg || parsed?.error_description || parsed?.message || parsed?.error || '';
    } catch {
      /* ignore */
    }
    const error = new Error(
      detail ? translateAuthError(detail) : `Supabase request failed (${response.status})`,
    );
    error.status = response.status >= 500 ? 502 : response.status;
    error.rawBody = body;
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

async function supabaseRequest(apiPath, accessToken, options = {}) {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    const error = new Error('Supabase backend non configuré');
    error.status = 503;
    throw error;
  }
  const bearer = accessToken || cfg.serviceRoleKey || cfg.anonKey;
  const response = await fetch(`${cfg.url}${apiPath}`, {
    ...options,
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${bearer}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  return readResponse(response);
}

// ==================== STOCKAGE LOCAL DE SECOURS (TESTS / HORS-LIGNE) ====================
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
    messages: [],
    actionReceipts: {},
  };
}

let dbCache = null;

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      const initial = createInitialDb();
      dbCache = {
        users: raw.users || initial.users,
        sessions: raw.sessions || initial.sessions,
        battleHistory: Array.isArray(raw.battleHistory) ? raw.battleHistory : [],
        messages: Array.isArray(raw.messages) ? raw.messages : [],
        actionReceipts: raw.actionReceipts || {},
      };
      return dbCache;
    }
  } catch {
    /* fallback to initial DB */
  }
  if (!dbCache) {
    dbCache = createInitialDb();
    saveDb(dbCache);
  }
  return dbCache;
}

function saveDb(db = dbCache) {
  if (!db) return;
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch {
      /* ignore write errors in read-only environments */
    }
  }
}

function sanitizeUser(user) {
  const filiere = normalizeFiliere(user.state?.filiere ?? user.filiere) || 'ARI';
  const theme = themeForFiliere(filiere);
  return {
    id: user.id,
    email: user.email,
    username: user.username || 'Étudiant',
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

// ==================== AUTHENTIFICATION & PROFILS ====================
async function isUsernameTakenSupabase(username, excludeUserId = null) {
  try {
    const clean = username.trim();
    const rows = await supabaseRequest(
      `/rest/v1/profiles?select=id,username&username=ilike.${encodeURIComponent(clean)}&limit=10`,
      null,
    );
    if (!Array.isArray(rows)) return false;
    return rows.some(
      (r) =>
        r.id !== excludeUserId &&
        typeof r.username === 'string' &&
        r.username.trim().toLowerCase() === clean.toLowerCase(),
    );
  } catch {
    return false;
  }
}

async function upsertSupabaseProfile(accessToken, { id, username, filiere, xp, level, streak }) {
  const now = new Date().toISOString();
  const payload = {
    id,
    username,
    filiere: normalizeFiliere(filiere) || 'ARI',
    ...(xp !== undefined ? { xp } : {}),
    ...(level !== undefined ? { level } : {}),
    ...(streak !== undefined ? { streak } : {}),
    updated_at: now,
  };
  try {
    await supabaseRequest('/rest/v1/profiles?on_conflict=id', accessToken, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(payload),
    });
  } catch {
    const { filiere: _omit, ...fallbackPayload } = payload;
    await supabaseRequest('/rest/v1/profiles?on_conflict=id', accessToken, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(fallbackPayload),
    });
  }
}

async function signUpUser({ email, password, username, filiere }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '');
  const normFiliere = normalizeFiliere(filiere) || 'ARI';

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

  const cfg = getSupabaseConfig();
  if (cfg) {
    if (await isUsernameTakenSupabase(cleanUsername)) {
      const err = new Error('Ce pseudo est déjà pris. Choisis-en un autre.');
      err.status = 409;
      throw err;
    }

    let accessToken = null;
    let refreshToken = null;
    let userId = null;

    if (cfg.serviceRoleKey) {
      const createRes = await fetch(`${cfg.url}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          apikey: cfg.serviceRoleKey,
          Authorization: `Bearer ${cfg.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: { username: cleanUsername, filiere: normFiliere },
        }),
      });
      const createdUser = await readResponse(createRes);
      userId = createdUser?.id;

      const tokenRes = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });
      const tokenData = await readResponse(tokenRes);
      accessToken = tokenData?.access_token || null;
      refreshToken = tokenData?.refresh_token || null;
      userId = userId || tokenData?.user?.id;
    } else {
      const signUpRes = await fetch(`${cfg.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          data: { username: cleanUsername, filiere: normFiliere },
        }),
      });
      const signUpData = await readResponse(signUpRes);
      const u = signUpData?.user || signUpData;
      if (Array.isArray(u?.identities) && u.identities.length === 0) {
        const err = new Error('Cet e-mail est déjà utilisé.');
        err.status = 409;
        throw err;
      }
      userId = u?.id;
      accessToken = signUpData?.access_token || signUpData?.session?.access_token || null;
      refreshToken = signUpData?.refresh_token || signUpData?.session?.refresh_token || null;

      if (!accessToken) {
        try {
          const tokenRes = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              apikey: cfg.anonKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            accessToken = tokenData?.access_token || null;
            refreshToken = tokenData?.refresh_token || null;
            userId = userId || tokenData?.user?.id;
          }
        } catch {
          /* ignore */
        }
      }
    }

    const initialState = normalizeState({
      ...defaultState(),
      filiere: normFiliere,
      theme: themeForFiliere(normFiliere),
    });

    if (userId && (accessToken || cfg.serviceRoleKey)) {
      const authBearer = accessToken || cfg.serviceRoleKey;
      try {
        await upsertSupabaseProfile(authBearer, {
          id: userId,
          username: cleanUsername,
          filiere: normFiliere,
          xp: 0,
          level: 1,
          streak: 0,
        });
      } catch {
        /* profile trigger may have already inserted */
      }
      try {
        await supabaseRequest('/rest/v1/user_state?on_conflict=user_id', authBearer, {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({
            user_id: userId,
            state: initialState,
            updated_at: new Date().toISOString(),
          }),
        });
      } catch {
        /* ignore */
      }
    }

    return {
      token: accessToken,
      refreshToken,
      needsConfirmation: !accessToken,
      user: {
        id: userId || crypto.randomUUID(),
        email: cleanEmail,
        username: cleanUsername,
        filiere: normFiliere,
        theme: themeForFiliere(normFiliere),
      },
      state: initialState,
    };
  }

  // Fallback local (tests / hors-ligne sans Supabase)
  const db = loadDb();
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

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
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
    refreshToken: token,
    user: sanitizeUser(user),
    state: user.state,
  };
}

async function signInUser({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  const cfg = getSupabaseConfig();
  if (cfg) {
    const res = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });
    if (!res.ok) {
      const bodyText = await res.text();
      let msg = 'E-mail ou mot de passe incorrect.';
      try {
        const parsed = JSON.parse(bodyText);
        const raw = parsed?.error_description || parsed?.msg || parsed?.message || '';
        if (raw) msg = translateAuthError(raw);
      } catch {
        /* ignore */
      }
      const err = new Error(msg);
      err.status = 401;
      throw err;
    }

    const data = await res.json();
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const authUser = data.user;

    const [profile, loadedState] = await Promise.all([
      getProfile(accessToken, authUser.id).catch(() => null),
      loadProgress(accessToken, authUser.id).catch(() => null),
    ]);

    const filiere =
      normalizeFiliere(
        loadedState?.filiere ?? profile?.filiere ?? authUser?.user_metadata?.filiere,
      ) || 'ARI';
    const username =
      profile?.username ||
      authUser?.user_metadata?.username ||
      (authUser?.email ? authUser.email.split('@')[0] : 'Étudiant');

    const state = normalizeState({
      ...(loadedState || defaultState()),
      filiere,
      theme: themeForFiliere(filiere),
    });

    if (!profile) {
      await upsertSupabaseProfile(accessToken, {
        id: authUser.id,
        username,
        filiere,
        xp: state.xp,
        level: levelFromXp(state.xp),
        streak: state.streak,
      }).catch(() => {});
    }
    if (!loadedState || loadedState.filiere !== filiere) {
      await saveProgress(accessToken, authUser.id, state).catch(() => {});
    }

    return {
      token: accessToken,
      refreshToken,
      user: {
        id: authUser.id,
        email: authUser.email || cleanEmail,
        username,
        filiere,
        theme: themeForFiliere(filiere),
      },
      state,
    };
  }

  // Fallback local
  const db = loadDb();
  const user = findUserByEmail(db, cleanEmail);
  if (!user || !verifyPassword(cleanPassword, user.passwordHash)) {
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
    refreshToken: token,
    user: sanitizeUser(user),
    state: user.state,
  };
}

async function refreshUserSession(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    const err = new Error('Jeton de rafraîchissement manquant.');
    err.status = 401;
    throw err;
  }

  const cfg = getSupabaseConfig();
  if (cfg) {
    const res = await fetch(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      const err = new Error('Session expirée, reconnecte-toi.');
      err.status = 401;
      throw err;
    }
    const data = await res.json();
    const accessToken = data.access_token;
    const newRefreshToken = data.refresh_token;
    const authUser = data.user;
    const profile = authUser?.id
      ? await getProfile(accessToken, authUser.id).catch(() => null)
      : null;
    const filiere =
      normalizeFiliere(profile?.filiere ?? authUser?.user_metadata?.filiere) || 'ARI';
    const username =
      profile?.username ||
      authUser?.user_metadata?.username ||
      (authUser?.email ? authUser.email.split('@')[0] : 'Étudiant');

    return {
      token: accessToken,
      refreshToken: newRefreshToken,
      user: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            username,
            filiere,
            theme: themeForFiliere(filiere),
          }
        : null,
    };
  }

  const db = loadDb();
  const session = db.sessions[refreshToken];
  const user = session ? db.users[session.userId] : null;
  if (!user) {
    const err = new Error('Session expirée, reconnecte-toi.');
    err.status = 401;
    throw err;
  }
  return {
    token: refreshToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

async function signOutUser(accessToken) {
  const cfg = getSupabaseConfig();
  if (cfg && accessToken) {
    try {
      await fetch(`${cfg.url}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      /* ignore */
    }
    return;
  }
  const db = loadDb();
  if (accessToken && db.sessions[accessToken]) {
    delete db.sessions[accessToken];
    saveDb(db);
  }
}

async function resetUserPassword({ email, newPassword }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    const err = new Error('Adresse e-mail requise.');
    err.status = 400;
    throw err;
  }

  const cfg = getSupabaseConfig();
  if (cfg) {
    const res = await fetch(`${cfg.url}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail }),
    });
    await readResponse(res);
    return { ok: true };
  }

  const db = loadDb();
  const user = findUserByEmail(db, cleanEmail);
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
  if (!accessToken) return null;
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const response = await fetch(`${cfg.url}/auth/v1/user`, {
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return null;
      const user = await response.json();
      if (!user?.id) return null;
      const filiere = normalizeFiliere(user.user_metadata?.filiere);
      return {
        id: user.id,
        email: user.email,
        username:
          user.user_metadata?.username ||
          (user.email ? user.email.split('@')[0] : 'Étudiant'),
        filiere,
        theme: themeForFiliere(filiere),
        user_metadata: user.user_metadata,
      };
    } catch {
      return null;
    }
  }

  const db = loadDb();
  const session = db.sessions[accessToken];
  if (!session) return null;
  const user = db.users[session.userId];
  if (!user) return null;
  return sanitizeUser(user);
}

// ==================== PROGRESSION & PROFIL ====================
async function getProfile(accessToken, userId) {
  if (isSupabaseConfigured()) {
    try {
      const rows = await supabaseRequest(
        `/rest/v1/profiles?select=id,username,filiere,xp,level,streak,created_at&id=eq.${encodeURIComponent(userId)}&limit=1`,
        accessToken,
      );
      const row = rows?.[0];
      if (!row) return null;
      const filiere = normalizeFiliere(row.filiere);
      return {
        id: row.id,
        username: row.username,
        filiere,
        theme: themeForFiliere(filiere),
        xp: row.xp ?? 0,
        level: row.level ?? levelFromXp(row.xp ?? 0),
        streak: row.streak ?? 0,
        created_at: row.created_at,
      };
    } catch {
      const rows = await supabaseRequest(
        `/rest/v1/profiles?select=id,username,xp,level,streak,created_at&id=eq.${encodeURIComponent(userId)}&limit=1`,
        accessToken,
      );
      const row = rows?.[0];
      if (!row) return null;
      return {
        id: row.id,
        username: row.username,
        filiere: null,
        theme: themeForFiliere(null),
        xp: row.xp ?? 0,
        level: row.level ?? levelFromXp(row.xp ?? 0),
        streak: row.streak ?? 0,
        created_at: row.created_at,
      };
    }
  }

  const db = loadDb();
  const user = db.users[userId];
  if (!user) return null;
  return sanitizeUser(user);
}

async function loadProgress(accessToken, userId) {
  if (isSupabaseConfigured()) {
    const [rows, profile] = await Promise.all([
      supabaseRequest(
        `/rest/v1/user_state?select=state&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
        accessToken,
      ),
      getProfile(accessToken, userId).catch(() => null),
    ]);
    const rawState = rows?.[0]?.state ?? null;
    if (!rawState) return null;
    const normalized = normalizeState(rawState);
    const resolvedFiliere = normalizeFiliere(normalized.filiere ?? profile?.filiere);
    if (resolvedFiliere) {
      normalized.filiere = resolvedFiliere;
      normalized.theme = themeForFiliere(resolvedFiliere);
    }
    return normalized;
  }

  const db = loadDb();
  const user = db.users[userId];
  if (!user) return null;
  user.state = normalizeState(user.state);
  return user.state;
}

async function saveProgress(accessToken, userId, state) {
  if (isSupabaseConfigured()) {
    const profile = await getProfile(accessToken, userId).catch(() => null);
    const existingFiliere = normalizeFiliere(profile?.filiere || state?.filiere);
    const normalized = normalizeState(state);
    if (existingFiliere) {
      normalized.filiere = existingFiliere;
      normalized.theme = themeForFiliere(existingFiliere);
    }
    const now = new Date().toISOString();

    await supabaseRequest('/rest/v1/user_state?on_conflict=user_id', accessToken, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        state: normalized,
        updated_at: now,
      }),
    });

    if (profile) {
      const patchBody = {
        xp: normalized.xp,
        level: levelFromXp(normalized.xp),
        streak: normalized.streak,
        ...(!profile.filiere && normalized.filiere ? { filiere: normalized.filiere } : {}),
        updated_at: now,
      };
      try {
        await supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, accessToken, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(patchBody),
        });
      } catch {
        const { filiere: _omit, ...fallbackPatch } = patchBody;
        await supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, accessToken, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(fallbackPatch),
        });
      }
    } else {
      const authUser = await verifyAccessToken(accessToken);
      const fallbackUsername =
        authUser?.username || `etudiant_${String(userId).replace(/-/g, '').slice(0, 6)}`;
      await upsertSupabaseProfile(accessToken, {
        id: userId,
        username: fallbackUsername,
        filiere: normalized.filiere || authUser?.filiere || 'ARI',
        xp: normalized.xp,
        level: levelFromXp(normalized.xp),
        streak: normalized.streak,
      }).catch(() => {});
    }

    return normalized;
  }

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

async function updateProfile(accessToken, userId, { username, filiere }) {
  if (isSupabaseConfigured()) {
    const [profile, currentState, authUser] = await Promise.all([
      getProfile(accessToken, userId).catch(() => null),
      loadProgress(accessToken, userId).catch(() => null),
      verifyAccessToken(accessToken).catch(() => null),
    ]);

    let finalUsername = profile?.username || authUser?.username || 'Étudiant';
    let finalFiliere = normalizeFiliere(
      profile?.filiere ?? currentState?.filiere ?? authUser?.filiere,
    );

    if (typeof username === 'string' && username.trim()) {
      const clean = username.trim();
      if (!/^[\w.\- ·À-ÿ]{3,28}$/.test(clean)) {
        const err = new Error('Pseudo invalide (3 à 24 caractères).');
        err.status = 400;
        throw err;
      }
      if (await isUsernameTakenSupabase(clean, userId)) {
        const err = new Error('Ce pseudo est déjà pris.');
        err.status = 409;
        throw err;
      }
      finalUsername = clean;
    }

    if (filiere !== undefined) {
      const norm = normalizeFiliere(filiere);
      if (!norm) {
        const err = new Error('Filière invalide (ARI ou AIP attendu).');
        err.status = 400;
        throw err;
      }
      if (finalFiliere && finalFiliere !== norm) {
        const err = new Error('La filière ne peut plus être modifiée une fois choisie.');
        err.status = 400;
        throw err;
      }
      finalFiliere = norm;
    }

    const resolvedFiliere = finalFiliere || 'ARI';
    const nextState = normalizeState({
      ...(currentState || defaultState()),
      filiere: resolvedFiliere,
      theme: themeForFiliere(resolvedFiliere),
    });

    await upsertSupabaseProfile(accessToken, {
      id: userId,
      username: finalUsername,
      filiere: resolvedFiliere,
      xp: nextState.xp,
      level: levelFromXp(nextState.xp),
      streak: nextState.streak,
    });

    await saveProgress(accessToken, userId, nextState);

    const cfg = getSupabaseConfig();
    if (cfg && accessToken) {
      await fetch(`${cfg.url}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { username: finalUsername, filiere: resolvedFiliere } }),
      }).catch(() => {});
    }

    return {
      user: {
        id: userId,
        email: authUser?.email,
        username: finalUsername,
        filiere: resolvedFiliere,
        theme: themeForFiliere(resolvedFiliere),
      },
      state: nextState,
    };
  }

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

// ==================== CLASSEMENT & BATTLES ====================
async function getLeaderboard(accessToken, limit = 50) {
  const safeLimit = Math.min(1000, Math.max(1, Number.parseInt(limit, 10) || 50));
  if (isSupabaseConfigured()) {
    let rows;
    try {
      rows = await supabaseRequest(
        `/rest/v1/profiles?select=id,username,filiere,xp,level,streak&order=xp.desc,streak.desc,id.asc&limit=${safeLimit}`,
        accessToken,
      );
    } catch {
      rows = await supabaseRequest(
        `/rest/v1/profiles?select=id,username,xp,level,streak&order=xp.desc,streak.desc,id.asc&limit=${safeLimit}`,
        accessToken,
      );
    }
    return (rows || []).map((r) => ({
      id: r.id,
      username: r.username,
      filiere: normalizeFiliere(r.filiere) || 'ARI',
      xp: r.xp ?? 0,
      level: r.level ?? levelFromXp(r.xp ?? 0),
      streak: r.streak ?? 0,
    }));
  }

  const db = loadDb();
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

async function getBattleData(referenceDate = new Date()) {
  if (isSupabaseConfigured()) {
    try {
      let profiles = [];
      try {
        profiles =
          (await supabaseRequest('/rest/v1/profiles?select=id,filiere,xp&limit=5000', null)) || [];
      } catch {
        profiles = [];
      }
      const usersMap = {};
      for (const p of profiles) {
        usersMap[p.id] = { filiere: normalizeFiliere(p.filiere) || 'ARI', xp: p.xp ?? 0 };
      }
      const currentBattle = computeBattleScores(usersMap, referenceDate);

      let history = [];
      try {
        const battleRows =
          (await supabaseRequest(
            '/rest/v1/battles?select=*&status=eq.completed&order=ends_at.desc&limit=20',
            null,
          )) || [];
        history = battleRows.map((b) => ({
          id: b.id,
          weekLabel: b.week_label || b.weekLabel,
          startsAt: b.starts_at || b.startsAt,
          endsAt: b.ends_at || b.endsAt,
          ariScore: b.ari_score ?? b.ariScore ?? 0,
          aipScore: b.aip_score ?? b.aipScore ?? 0,
          ariMembers: b.ari_members ?? b.ariMembers ?? 0,
          aipMembers: b.aip_members ?? b.aipMembers ?? 0,
          winner: b.winner || 'EGALITE',
          status: 'completed',
        }));
      } catch {
        history = [];
      }

      if (currentBattle.isFinished && !history.some((h) => h.id === currentBattle.id)) {
        history.unshift({
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
        });
      }

      return { currentBattle, history };
    } catch {
      /* fallback to local battle computation */
    }
  }

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
  const battle = await getBattleData();
  return {
    AIP: battle.currentBattle.aipScore,
    ARI: battle.currentBattle.ariScore,
    userVote: null,
  };
}

// ==================== MESSAGERIE & REÇUS D'ACTIONS ====================
async function insertMessage(accessToken, senderId, recipientId, body) {
  if (isSupabaseConfigured()) {
    const rows = await supabaseRequest('/rest/v1/messages', accessToken, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ sender_id: senderId, recipient_id: recipientId, body }),
    });
    return rows?.[0] ?? null;
  }

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

async function deleteMessageForParticipants(accessToken, userId, messageId) {
  if (isSupabaseConfigured()) {
    const query = new URLSearchParams({
      select: 'id',
      id: `eq.${messageId}`,
      or: `(sender_id.eq.${userId},recipient_id.eq.${userId})`,
    });
    const rows = await supabaseRequest(`/rest/v1/messages?${query}`, accessToken, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    });
    return rows?.length ?? 0;
  }

  const db = loadDb();
  if (!Array.isArray(db.messages)) return 0;
  const initialLen = db.messages.length;
  db.messages = db.messages.filter(
    (m) => !(m.id === messageId && (m.sender_id === userId || m.recipient_id === userId)),
  );
  saveDb(db);
  return initialLen - db.messages.length;
}

async function deleteConversationForParticipants(accessToken, userId, partnerId) {
  if (isSupabaseConfigured()) {
    const conversation = `(and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId}))`;
    const query = new URLSearchParams({ select: 'id', or: conversation });
    const rows = await supabaseRequest(`/rest/v1/messages?${query}`, accessToken, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    });
    return rows?.length ?? 0;
  }

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

const memoryReceipts = new Map();

async function getActionReceipt(accessToken, userId, actionId) {
  if (!actionId) return null;
  if (isSupabaseConfigured()) {
    try {
      const query = new URLSearchParams({
        select: 'result',
        user_id: `eq.${userId}`,
        action_id: `eq.${actionId}`,
        limit: '1',
      });
      const rows = await supabaseRequest(`/rest/v1/progress_action_receipts?${query}`, accessToken);
      if (rows?.[0]?.result) return rows[0].result;
    } catch {
      /* fallback to memoryReceipts if table does not exist */
    }
    return memoryReceipts.get(`${userId}:${actionId}`) ?? null;
  }

  const db = loadDb();
  return db.actionReceipts?.[`${userId}:${actionId}`] ?? null;
}

async function saveActionReceipt(accessToken, userId, actionId, result) {
  if (!actionId) return;
  if (isSupabaseConfigured()) {
    memoryReceipts.set(`${userId}:${actionId}`, result);
    try {
      await supabaseRequest('/rest/v1/progress_action_receipts', accessToken, {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ user_id: userId, action_id: actionId, result }),
      });
    } catch {
      /* ignore if progress_action_receipts table is missing */
    }
    return;
  }

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
  isSupabaseConfigured,
  loadProgress,
  overtakenPlayerIds,
  readResponse,
  refreshUserSession,
  resetUserPassword,
  runWithRequestContext,
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
