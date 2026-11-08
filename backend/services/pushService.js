const webPush = require('web-push');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@akademia.app';

function isConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey && vapidPublicKey && vapidPrivateKey);
}

function requireConfig() {
  if (!isConfigured()) {
    const error = new Error('Les notifications push ne sont pas configurées sur le serveur.');
    error.status = 503;
    throw error;
  }
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function adminRequest(path, options = {}) {
  requireConfig();
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`Push storage request failed (${response.status})`);
    error.status = response.status >= 500 ? 502 : response.status;
    throw error;
  }
  if (!body.trim()) return null;
  try { return JSON.parse(body); } catch { return null; }
}

async function saveSubscription(userId, subscription) {
  if (!subscription || typeof subscription !== 'object'
    || typeof subscription.endpoint !== 'string'
    || !subscription.endpoint.startsWith('https://')
    || typeof subscription.keys?.auth !== 'string'
    || typeof subscription.keys?.p256dh !== 'string') {
    const error = new Error('Abonnement push invalide.');
    error.status = 400;
    throw error;
  }
  const endpoint = subscription.endpoint;
  await adminRequest('/rest/v1/push_subscriptions?on_conflict=endpoint', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, endpoint, subscription, updated_at: new Date().toISOString() }),
  });
}

async function removeSubscription(userId, endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
    const error = new Error('Abonnement push invalide.');
    error.status = 400;
    throw error;
  }
  const query = new URLSearchParams({ user_id: `eq.${userId}`, endpoint: `eq.${endpoint}` });
  await adminRequest(`/rest/v1/push_subscriptions?${query}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
}

async function sendToUsers(userIds, payload) {
  requireConfig();
  const ids = [...new Set(userIds)].filter((id) => typeof id === 'string');
  if (!ids.length) return 0;
  const query = new URLSearchParams({ select: 'user_id,endpoint,subscription', user_id: `in.(${ids.join(',')})` });
  const subscriptions = await adminRequest(`/rest/v1/push_subscriptions?${query}`) || [];
  const results = await Promise.allSettled(subscriptions.map(async (row) => {
    try {
      await webPush.sendNotification(row.subscription, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
      return true;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        const endpoint = new URLSearchParams({ endpoint: `eq.${row.endpoint}` });
        await adminRequest(`/rest/v1/push_subscriptions?${endpoint}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      }
      throw error;
    }
  }));
  return results.filter((result) => result.status === 'fulfilled').length;
}

async function notifyOvertaken(userIds, username) {
  if (!isConfigured()) return 0;
  return sendToUsers(userIds, {
    title: 'Classement Akademia',
    body: `${username} vient de te dépasser au classement. À toi de reprendre ta place !`,
    url: '/classement',
    tag: `rank-${username}`,
  });
}

async function notifyMessage(recipientId, senderId, senderName, body) {
  if (!isConfigured()) return 0;
  const preview = String(body).replace(/\s+/g, ' ').trim().slice(0, 140);
  return sendToUsers([recipientId], {
    title: `Nouveau message de ${senderName}`,
    body: preview,
    url: `/messages/${senderId}`,
    tag: `message-${recipientId}-${Date.now()}`,
  });
}

module.exports = {
  adminRequest,
  isConfigured,
  notifyMessage,
  notifyOvertaken,
  removeSubscription,
  saveSubscription,
  sendToUsers,
  vapidPublicKey,
};