import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationHat, TextBubble } from '@getpapillon/papicons';
import { Empty, PageTitle, Spinner } from '@/components/ui';
import MessageDeleteMenu from '@/components/MessageDeleteMenu';
import {
  ConversationPreview,
  deleteConversationForEveryone,
  deleteConversationForUser,
  getConversations,
} from '@/data/social';
import { useAuth } from '@/state/AuthContext';
import { CustomAvatar } from '@/components/CustomAvatar';
import { renderWithAnimatedEmojis } from '@/components/AnimatedEmoji';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user || user.guest || !cloud) return;
    getConversations(user.id)
      .then((rows) => {
        if (active) setConversations(rows);
      })
      .catch(() => {
        if (active)
          setError(
            'Impossible de charger tes conversations. Vérifie que le schéma de messagerie a été appliqué dans Supabase.',
          );
      });
    return () => {
      active = false;
    };
  }, [cloud, user]);

  if (!user || !cloud || user.guest) {
    return (
      <>
        <PageTitle title="Messages" icon={<TextBubble size={30} />} />
        <Empty mood="surprised" title="Connecte-toi pour utiliser la messagerie">
          <Link to="/connexion" className="btn btn-primary mt-3">
            Se connecter
          </Link>
        </Empty>
      </>
    );
  }
  if (error) return <Empty mood="surprised" title={error} />;
  if (!conversations) return <Spinner label="Chargement des conversations…" />;

  const removeConversation = async (partnerId: string, username: string) => {
    if (
      !confirm(
        `Supprimer la discussion avec ${username} de ta boîte ? L’autre joueur conservera son historique.`,
      )
    )
      return;
    setDeletingId(partnerId);
    try {
      await deleteConversationForUser(user.id, partnerId);
      setConversations((current) => current?.filter((item) => item.profile.id !== partnerId) ?? []);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Impossible de supprimer cette discussion.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const permanentlyRemoveConversation = async (partnerId: string, username: string) => {
    if (
      !confirm(
        `Supprimer définitivement tous les messages avec ${username} pour vous deux ? Cette action est irréversible.`,
      )
    )
      return;
    setDeletingId(partnerId);
    try {
      await deleteConversationForEveryone(user.id, partnerId);
      setConversations((current) => current?.filter((item) => item.profile.id !== partnerId) ?? []);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Impossible de supprimer définitivement cette discussion.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle
        title="Messagerie"
        sub="Tes échanges privés avec les autres étudiants."
        icon={<TextBubble size={30} />}
        right={
          <Link to="/classement" className="btn btn-soft !px-3">
            <GraduationHat size={16} /> Trouver un étudiant
          </Link>
        }
      />
      {conversations.length === 0 ? (
        <Empty mood="happy" title="Pas encore de message">
          Ouvre le classement et consulte le profil d’un étudiant pour lui écrire.
          <Link to="/classement" className="btn btn-primary mt-3">
            Voir le classement
          </Link>
        </Empty>
      ) : (
        <div className="card divide-y divide-line/60 overflow-hidden p-0">
          {conversations.map(({ profile, latest, unread }) => (
            <div
              key={profile.id}
              className="flex items-center gap-2 p-3 transition hover:bg-soft/50"
            >
              <Link
                to={`/messages/${profile.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <CustomAvatar name={profile.username} size={44} showBadge />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <b className="truncate font-display text-sm text-ink">{profile.username}</b>
                    <span className="shrink-0 text-[11px] font-bold text-muted">
                      {messageTime(latest.created_at)}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-semibold text-muted">
                      {latest.sender_id === user.id ? 'Vous : ' : ''}
                      {renderWithAnimatedEmojis(latest.body)}
                    </span>
                    {unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white">
                        {unread}
                      </span>
                    )}
                  </span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-muted" />
              </Link>
              <MessageDeleteMenu
                label={`la discussion avec ${profile.username}`}
                disabled={deletingId === profile.id}
                onDeleteForMe={() => void removeConversation(profile.id, profile.username)}
                onDeleteForEveryone={() =>
                  void permanentlyRemoveConversation(profile.id, profile.username)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
