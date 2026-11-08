import { API_BASE_URL, supabase } from './supabase';
import { getStoredToken } from './repo';

interface PushConfig {
  enabled: boolean;
  publicKey: string | null;
}

function fromBase64Url(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function getAccessToken(): Promise<string> {
  const stored = getStoredToken();
  if (stored) return stored;
  if (!supabase) throw new Error('Les notifications nécessitent un compte en ligne.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Reconnecte-toi pour gérer tes notifications.');
  return data.session.access_token;
}

async function pushRequest(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Erreur notification : ${response.status}`);
  }
  return response.status === 204 ? null : response.json().catch(() => null);
}

export async function getPushEnabled(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !supabase) return false;
  const registration = await navigator.serviceWorker.getRegistration('/');
  return Boolean(await registration?.pushManager.getSubscription());
}

export async function enablePush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Les notifications push ne sont pas prises en charge par ce navigateur.');
  }
  if (Notification.permission === 'denied') throw new Error('Les notifications sont bloquées dans les réglages du navigateur.');
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Autorise les notifications pour les activer.');

  const token = await getAccessToken();
  const configResponse = await fetch(`${API_BASE_URL}/push/config`);
  const config = await configResponse.json() as PushConfig;
  if (!configResponse.ok || !config.enabled || !config.publicKey) {
    throw new Error('Les notifications push ne sont pas encore configurées sur le serveur.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: fromBase64Url(config.publicKey) as BufferSource,
    });
  }
  await pushRequest('/push/subscriptions', token, {
    method: 'POST',
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
}

export async function disablePush(): Promise<void> {
  const token = await getAccessToken();
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  try {
    await pushRequest('/push/subscriptions', token, {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  } finally {
    await subscription.unsubscribe();
  }
}