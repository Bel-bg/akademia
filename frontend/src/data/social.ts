import type { RealtimeChannel } from '@supabase/supabase-js';
import { API_BASE_URL, supabase } from './supabase';

export interface PublicProfile {
  id: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationPreview {
  profile: PublicProfile;
  latest: DirectMessage;
  unread: number;
}

function client() {
  if (!supabase) throw new Error('La messagerie nécessite une connexion en ligne.');
  return supabase;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await client()
    .from('profiles')
    .select('id, username, xp, level, streak, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as PublicProfile | null;
}

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const { data: hiddenRows, error: hiddenError } = await client()
    .from('message_deletions')
    .select('message_id')
    .eq('user_id', userId);
  if (hiddenError) throw hiddenError;
  const hidden = new Set((hiddenRows ?? []).map((row) => row.message_id as string));

  const { data, error } = await client()
    .from('messages')
    .select('id, sender_id, recipient_id, body, created_at, read_at')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;

  const latestByPartner = new Map<string, { latest: DirectMessage; unread: number }>();
  for (const row of (data ?? []) as DirectMessage[]) {
    if (hidden.has(row.id)) continue;
    const partnerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
    const current = latestByPartner.get(partnerId);
    if (current) {
      if (row.recipient_id === userId && !row.read_at) current.unread += 1;
    } else {
      latestByPartner.set(partnerId, {
        latest: row,
        unread: row.recipient_id === userId && !row.read_at ? 1 : 0,
      });
    }
  }

  const partnerIds = [...latestByPartner.keys()];
  if (!partnerIds.length) return [];
  const { data: profiles, error: profileError } = await client()
    .from('profiles')
    .select('id, username, xp, level, streak, created_at')
    .in('id', partnerIds);
  if (profileError) throw profileError;

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile as PublicProfile]));
  return [...latestByPartner.entries()]
    .flatMap(([id, conversation]) => {
      const profile = profileById.get(id);
      return profile ? [{ profile, ...conversation }] : [];
    })
    .sort((a, b) => b.latest.created_at.localeCompare(a.latest.created_at));
}

export async function getConversation(userId: string, partnerId: string): Promise<DirectMessage[]> {
  const { data: hiddenRows, error: hiddenError } = await client()
    .from('message_deletions')
    .select('message_id')
    .eq('user_id', userId);
  if (hiddenError) throw hiddenError;
  const hidden = new Set((hiddenRows ?? []).map((row) => row.message_id as string));

  const { data, error } = await client()
    .from('messages')
    .select('id, sender_id, recipient_id, body, created_at, read_at')
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(300);
  if (error) throw error;
  return ((data ?? []) as DirectMessage[]).filter((message) => !hidden.has(message.id));
}

export async function deleteMessageForUser(userId: string, messageId: string): Promise<void> {
  const { data: session, error: sessionError } = await client().auth.getSession();
  if (sessionError || session.session?.user.id !== userId) throw new Error('Reconnecte-toi pour supprimer ce message.');
  const { error } = await client().from('message_deletions').upsert(
    { user_id: userId, message_id: messageId },
    { onConflict: 'user_id,message_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function deleteConversationForUser(userId: string, partnerId: string): Promise<void> {
  const { data: session, error: sessionError } = await client().auth.getSession();
  if (sessionError || session.session?.user.id !== userId) throw new Error('Reconnecte-toi pour supprimer cette discussion.');
  const { error } = await client().rpc('hide_conversation', { p_partner_id: partnerId });
  if (error) throw error;
}

async function deleteForEveryone(userId: string, path: string): Promise<void> {
  const { data: session, error: sessionError } = await client().auth.getSession();
  if (sessionError || !session.session?.access_token || session.session.user.id !== userId) {
    throw new Error('Reconnecte-toi pour supprimer définitivement.');
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.session.access_token}` },
  });
  const result = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(result?.error || `Suppression impossible (${response.status}).`);
}

export function deleteMessageForEveryone(userId: string, messageId: string): Promise<void> {
  return deleteForEveryone(userId, `/messages/${encodeURIComponent(messageId)}`);
}

export function deleteConversationForEveryone(userId: string, partnerId: string): Promise<void> {
  return deleteForEveryone(userId, `/messages/conversations/${encodeURIComponent(partnerId)}`);
}

export async function sendMessage(senderId: string, recipientId: string, body: string): Promise<DirectMessage> {
  const text = body.trim();
  if (!text || text.length > 2000) throw new Error('Le message doit contenir de 1 à 2 000 caractères.');
  if (senderId === recipientId) throw new Error('Tu ne peux pas t’envoyer un message.');
  const { data, error: sessionError } = await client().auth.getSession();
  if (sessionError || !data.session?.access_token || data.session.user.id !== senderId) {
    throw new Error('Reconnecte-toi pour envoyer un message.');
  }
  const response = await fetch(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({ recipientId, body: text }),
  });
  const result = await response.json().catch(() => null) as DirectMessage | { error?: string } | null;
  if (!response.ok) throw new Error((result as { error?: string } | null)?.error || `Envoi impossible (${response.status}).`);
  if (!result || !('id' in result)) throw new Error('Le serveur n’a pas confirmé le message.');
  return result;
}

export async function markConversationRead(userId: string, senderId: string): Promise<void> {
  const { error } = await client()
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('sender_id', senderId)
    .is('read_at', null);
  if (error) throw error;
}

export function subscribeToConversation(
  userId: string,
  partnerId: string,
  onMessage: (message: DirectMessage) => void,
  onDelete?: (messageId: string) => void,
): RealtimeChannel {
  const channel = client().channel(`dm:${[userId, partnerId].sort().join(':')}`);
  const receive = (message: DirectMessage) => {
    if ((message.sender_id === userId && message.recipient_id === partnerId)
      || (message.sender_id === partnerId && message.recipient_id === userId)) onMessage(message);
  };

  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, (event) => receive(event.new as DirectMessage))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, (event) => receive(event.new as DirectMessage))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (event) => {
      const deleted = event.old as Partial<DirectMessage>;
      const belongsToConversation = (deleted.sender_id === userId && deleted.recipient_id === partnerId)
        || (deleted.sender_id === partnerId && deleted.recipient_id === userId);
      if (belongsToConversation && deleted.id) onDelete?.(deleted.id);
    })
    .subscribe();
  return channel;
}