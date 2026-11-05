import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '@/state/AuthContext';

export default function AuthPage() {
  const { user, cloud, signIn, signUp, continueAsGuest, resetPassword } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && !user.guest) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    if (mode === 'in') {
      const err = await signIn(email.trim(), pw);
      if (err) setMsg({ ok: false, t: err }); else nav('/');
    } else {
      if (!/^[\w.\- ]{3,24}$/.test(name.trim())) { setMsg({ ok: false, t: 'Pseudo : 3 à 24 caractères (lettres, chiffres, . _ -).' }); setBusy(false); return; }
      const r = await signUp(email.trim(), pw, name.trim());
      if (r.error) setMsg({ ok: false, t: r.error });
      else if (r.needsConfirmation) setMsg({ ok: true, t: 'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.' });
      else nav('/');
    }
    setBusy(false);
  };

  const input = 'w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none focus:border-brand';
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B6CFF] to-[#4338E8] shadow-card"><Zap size={28} className="fill-[#FFD66B] text-[#FFD66B]" /></span>
          <h1 className="h-display mt-3 text-3xl">Akademia</h1>
          <p className="text-muted">Apprends, progresse, monte en puissance.</p>
        </div>
        {cloud && (
          <>
            <div className="mb-5 grid grid-cols-2 rounded-xl bg-soft p-1 text-sm font-bold">
              {(['in', 'up'] as const).map((k) => <button key={k} onClick={() => { setMode(k); setMsg(null); }} className={`rounded-lg py-2 ${mode === k ? 'bg-card shadow-card' : 'text-muted'}`}>{k === 'in' ? 'Connexion' : 'Créer un compte'}</button>)}
            </div>
            <form onSubmit={submit} className="space-y-3">
              {mode === 'up' && <input className={input} placeholder="Pseudo (visible au classement)" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="nickname" />}
              <input className={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <input className={input} type="password" placeholder="Mot de passe (6 caractères min.)" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
              {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`}>{msg.t}</p>}
              <button className="btn btn-primary btn-lg w-full" disabled={busy}>{busy ? '…' : mode === 'in' ? 'Se connecter' : 'Créer mon compte'}</button>
            </form>
            {mode === 'in' && <button className="mt-3 w-full text-center text-sm text-muted underline" onClick={async () => { if (!email) return setMsg({ ok: false, t: 'Saisis ton e-mail ci-dessus.' }); const e = await resetPassword(email.trim()); setMsg(e ? { ok: false, t: e } : { ok: true, t: 'Lien de réinitialisation envoyé par e-mail.' }); }}>Mot de passe oublié ?</button>}
            <div className="my-5 flex items-center gap-3 text-xs text-muted"><div className="h-px flex-1 bg-line" />ou<div className="h-px flex-1 bg-line" /></div>
          </>
        )}
        <button className="btn btn-soft btn-lg w-full" onClick={() => { continueAsGuest(); nav('/'); }}>Continuer sans compte</button>
        <p className="mt-3 text-center text-xs text-muted">{cloud ? 'Sans compte, ta progression reste sur cet appareil. Elle sera reprise si tu crées un compte ensuite.' : 'Mode local : ta progression est enregistrée dans ce navigateur.'}</p>
      </div>
    </div>
  );
}
