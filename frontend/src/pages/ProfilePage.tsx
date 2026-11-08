import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Flame, MessageCircle, Zap } from 'lucide-react';
import { Empty, PageTitle, Spinner, Stat } from '@/components/ui';
import { getPublicProfile, PublicProfile } from '@/data/social';
import { fmtNum } from '@/lib/utils';
import { tierFor } from '@/lib/gamification';
import { useAuth } from '@/state/AuthContext';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user, cloud } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (!userId || !cloud || user?.guest) {
      setLoading(false);
      return;
    }
    getPublicProfile(userId)
      .then((result) => { if (active) setProfile(result); })
      .catch(() => { if (active) setError('Impossible de charger ce profil.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cloud, user, userId]);

  if (!userId) return <Navigate to="/classement" replace />;
  if (!user || user.guest || !cloud) {
    return <Empty emoji="🔐" title="Connecte-toi pour voir les profils"><Link to="/connexion" className="btn btn-primary mt-2">Se connecter</Link></Empty>;
  }
  if (loading) return <Spinner label="Chargement du profil…" />;
  if (error) return <Empty emoji="⚠️" title={error}><Link to="/classement" className="btn btn-soft mt-2">Retour au classement</Link></Empty>;
  if (!profile) return <Empty emoji="👤" title="Profil introuvable"><Link to="/classement" className="btn btn-soft mt-2">Retour au classement</Link></Empty>;

  const tier = tierFor(profile.level);
  const isSelf = profile.id === user.id;

  return (
    <>
      <PageTitle title="Profil joueur" right={<Link to="/classement" className="btn btn-ghost"><ArrowLeft size={16} /> Classement</Link>} />
      <section className="card mx-auto max-w-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-4xl" style={{ background: `${tier.color}33` }} aria-hidden="true">{tier.emoji}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Profil public</p>
            <h2 className="mt-1 truncate text-2xl font-extrabold">{profile.username}{isSelf ? ' · Toi' : ''}</h2>
            <p className="mt-1 text-sm text-muted">{tier.name} · niveau {profile.level}</p>
          </div>
          {!isSelf && (
            <Link to={`/messages/${profile.id}`} className="btn btn-primary"><MessageCircle size={16} /> Envoyer un message</Link>
          )}
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Stat label="Puissance" value={<span className="flex items-center gap-2"><Zap size={18} className="text-accent" />{fmtNum(profile.xp)} XP</span>} />
          <Stat label="Série" value={<span className="flex items-center gap-2"><Flame size={18} className="text-accent" />{profile.streak} jours</span>} />
          <Stat label="Membre depuis" value={<span className="flex items-center gap-2"><CalendarDays size={18} />{new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>} />
        </div>
      </section>
    </>
  );
}