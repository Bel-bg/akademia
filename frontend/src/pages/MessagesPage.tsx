import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { Empty, PageTitle, Spinner } from '@/components/ui';
import { ConversationPreview, getConversations } from '@/data/social';
import { useAuth } from '@/state/AuthContext';

function messageTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function MessagesPage() {
  const { user, cloud } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user || user.guest || !cloud) return;
    getConversations(user.id)
      .then((rows) => { if (active) setConversations(rows); })
      .catch(() => { if (active) setError('Impossible de charger tes conversations. Vérifie que le schéma de messagerie a été appliqué dans Supabase.'); });
    return () => { active = false; };
  }, [cloud, user]);

  if (!user || !cloud || user.guest) {
    return (
      <>
        <PageTitle title="Messages" emoji="💬" />
        <Empty emoji="🔐" title="Connecte-toi pour utiliser la messagerie">
          <Link to="/connexion" className="btn btn-primary mt-2">Se connecter</Link>
        </Empty>
      </>
    );
  }
  if (error) return <Empty emoji="⚠️" title={error} />;
  if (!conversations) return <Spinner label="Chargement des conversations…" />;

  return (
    <>
      <PageTitle
        title="Messages"
        sub="Tes conversations privées avec les autres joueurs."
        emoji="💬"
        right={<Link to="/classement" className="btn btn-soft"><Users size={16} /> Trouver un joueur</Link>}
      />
      {conversations.length === 0 ? (
        <Empty emoji="✉️" title="Pas encore de conversation">
          Ouvre le classement et consulte le profil d’un joueur pour lui écrire.
          <Link to="/classement" className="btn btn-primary mt-2">Voir le classement</Link>
        </Empty>
      ) : (
        <div className="card divide-y divide-line">
          {conversations.map(({ profile, latest, unread }) => (
            <Link key={profile.id} to={`/messages/${profile.id}`} className="flex items-center gap-3 p-4 transition hover:bg-soft/70">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/15 font-extrabold text-brand" aria-hidden="true">
                {profile.username.slice(0, 1).toLocaleUpperCase('fr-FR')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <b className="truncate">{profile.username}</b>
                  <span className="shrink-0 text-xs text-muted">{messageTime(latest.created_at)}</span>
                </span>
                <span className="mt-1 flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-muted">{latest.sender_id === user.id ? 'Vous : ' : ''}{latest.body}</span>
                  {unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">{unread}</span>}
                </span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}