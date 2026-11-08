import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Empty, Spinner } from '@/components/ui';
import MessageDeleteMenu from '@/components/MessageDeleteMenu';
import { deleteMessageForEveryone, deleteMessageForUser, DirectMessage, getConversation, getPublicProfile, markConversationRead, PublicProfile, sendMessage, subscribeToConversation } from '@/data/social';
import { supabase } from '@/data/supabase';
import { useAuth } from '@/state/AuthContext';

function appendMessage(messages: DirectMessage[], message: DirectMessage) {
  if (messages.some((item) => item.id === message.id)) return messages;
  return [...messages, message].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function messageClock(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationPage() {
  const { userId: partnerId } = useParams();
  const { user, cloud } = useAuth();
  const [partner, setPartner] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setPartner(null);
    setMessages(null);
    setError('');
    if (!user || user.guest || !cloud || !partnerId || partnerId === user.id) return;
    Promise.all([getPublicProfile(partnerId), getConversation(user.id, partnerId)])
      .then(async ([profile, history]) => {
        if (!active) return;
        if (!profile) {
          setError('Ce profil est introuvable.');
          return;
        }
        setPartner(profile);
        setMessages(history);
        try { await markConversationRead(user.id, partnerId); } catch { /* l’historique reste lisible */ }
      })
      .catch(() => {
        if (active) setError('Impossible de charger cette conversation. Vérifie que le schéma de messagerie a été appliqué dans Supabase.');
      });
    return () => { active = false; };
  }, [cloud, partnerId, user]);

  useEffect(() => {
    if (!user || user.guest || !cloud || !partnerId || partnerId === user.id) return;
    const channel = subscribeToConversation(
      user.id,
      partnerId,
      (message) => {
        setMessages((current) => current ? appendMessage(current, message) : current);
        if (message.recipient_id === user.id) void markConversationRead(user.id, partnerId).catch(() => undefined);
      },
      (messageId) => setMessages((current) => current?.filter((message) => message.id !== messageId) ?? []),
    );
    return () => { if (supabase) void supabase.removeChannel(channel); };
  }, [cloud, partnerId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  if (!partnerId) return <Navigate to="/messages" replace />;
  if (user && partnerId === user.id) return <Navigate to={`/joueurs/${user.id}`} replace />;
  if (!user || !cloud || user.guest) {
    return <Empty emoji="🔐" title="Connecte-toi pour envoyer des messages"><Link to="/connexion" className="btn btn-primary mt-2">Se connecter</Link></Empty>;
  }
  if (error) return <Empty emoji="⚠️" title={error}><Link to="/messages" className="btn btn-soft mt-2">Retour aux messages</Link></Empty>;
  if (!partner || !messages) return <Spinner label="Ouverture de la conversation…" />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const message = await sendMessage(user.id, partner.id, body);
      setMessages((current) => current ? appendMessage(current, message) : [message]);
      setDraft('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Impossible d’envoyer le message.');
    } finally {
      setSending(false);
    }
  };

  const removeMessage = async (messageId: string) => {
    if (!confirm('Supprimer ce message de ta conversation ? L’autre joueur conservera sa copie.')) return;
    setDeletingId(messageId);
    setError('');
    try {
      await deleteMessageForUser(user.id, messageId);
      setMessages((current) => current?.filter((message) => message.id !== messageId) ?? []);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer ce message.');
    } finally {
      setDeletingId(null);
    }
  };

  const permanentlyRemoveMessage = async (messageId: string) => {
    if (!confirm('Supprimer définitivement ce message pour vous deux ? Cette action est irréversible.')) return;
    setDeletingId(messageId);
    setError('');
    try {
      await deleteMessageForEveryone(user.id, messageId);
      setMessages((current) => current?.filter((message) => message.id !== messageId) ?? []);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer définitivement ce message.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mx-auto flex h-[min(76vh,760px)] min-h-[420px] max-w-3xl flex-col overflow-hidden rounded-xl border border-line bg-card">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Link to="/messages" className="btn btn-ghost !px-2" aria-label="Retour aux messages"><ArrowLeft size={18} /></Link>
        <Link to={`/joueurs/${partner.id}`} className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 font-extrabold text-brand" aria-hidden="true">{partner.username.slice(0, 1).toLocaleUpperCase('fr-FR')}</span>
          <span className="truncate font-bold">{partner.username}</span>
        </Link>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-label="Historique des messages">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">C’est le début de votre conversation. Dis bonjour !</p>}
        {messages.map((message) => {
          const own = message.sender_id === user.id;
          return (
            <div key={message.id} className={`flex items-center gap-1 ${own ? 'justify-end' : 'justify-start'}`}>
              {!own && <MessageDeleteMenu label="ce message" disabled={deletingId === message.id} onDeleteForMe={() => void removeMessage(message.id)} onDeleteForEveryone={() => void permanentlyRemoveMessage(message.id)} />}
              <article className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[72%] ${own ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm bg-soft text-ink'}`}>
                <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                <p className={`mt-1 text-right text-[10px] ${own ? 'text-white/70' : 'text-muted'}`}>{messageClock(message.created_at)}</p>
              </article>
              {own && <MessageDeleteMenu label="ce message" disabled={deletingId === message.id} onDeleteForMe={() => void removeMessage(message.id)} onDeleteForEveryone={() => void permanentlyRemoveMessage(message.id)} />}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-line p-3">
        {error && <p role="alert" className="mb-2 text-sm text-bad">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Écrire un message…"
            aria-label="Message"
            className="min-h-11 flex-1 resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button type="submit" className="btn btn-primary" disabled={!draft.trim() || sending} aria-label="Envoyer le message">
            <Send size={16} /> <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>
        <p className="mt-1 text-right text-[11px] text-muted">{draft.length}/2 000</p>
      </form>
    </section>
  );
}