const { levelFromXp } = require('./progressionService');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function isConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('VOTRE-PROJET'));
}

function requireConfig() {
  if (!isConfigured()) {
    const error = new Error('Supabase backend non configuré');
    error.status = 503;
    throw error;
  }
}

async function supabaseRequest(path, accessToken, options = {}) {
  requireConfig();
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  return readResponse(response);
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

async function verifyAccessToken(accessToken) {
  requireConfig();
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user?.id ? user : null;
}

async function loadProgress(accessToken, userId) {
  const rows = await supabaseRequest(`/rest/v1/user_state?select=state&user_id=eq.${encodeURIComponent(userId)}&limit=1`, accessToken);
  return rows?.[0]?.state ?? null;
}

async function saveProgress(accessToken, userId, state) {
  await supabaseRequest('/rest/v1/user_state?on_conflict=user_id', accessToken, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, state, updated_at: new Date().toISOString() }),
  });
  await supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, accessToken, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ xp: state.xp, level: levelFromXp(state.xp), streak: state.streak, updated_at: new Date().toISOString() }),
  });
  return state;
}

async function getLeaderboard(accessToken, limit = 50) {
  const safeLimit = Math.min(1000, Math.max(1, Number.parseInt(limit, 10) || 50));
  return supabaseRequest(`/rest/v1/profiles?select=id,username,xp,level,streak&order=xp.desc,streak.desc,id.asc&limit=${safeLimit}`, accessToken);
}

async function getProfile(accessToken, userId) {
  const rows = await supabaseRequest(`/rest/v1/profiles?select=username&id=eq.${encodeURIComponent(userId)}&limit=1`, accessToken);
  return rows?.[0] ?? null;
}

async function insertMessage(accessToken, senderId, recipientId, body) {
  const rows = await supabaseRequest('/rest/v1/messages', accessToken, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ sender_id: senderId, recipient_id: recipientId, body }),
  });
  return rows?.[0] ?? null;
}

function overtakenPlayerIds(before, after, userId) {
  const oldRank = before.findIndex((player) => player.id === userId);
  const newRank = after.findIndex((player) => player.id === userId);
  if (oldRank < 0 || newRank < 0 || newRank >= oldRank) return [];
  return before.slice(newRank, oldRank).map((player) => player.id);
}

module.exports = { getLeaderboard, getProfile, insertMessage, isConfigured, loadProgress, overtakenPlayerIds, readResponse, saveProgress, verifyAccessToken };
