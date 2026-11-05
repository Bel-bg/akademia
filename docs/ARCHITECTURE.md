# Architecture

**Stack** : React 18, Vite, TypeScript strict, Tailwind (thème par variables CSS, mode sombre), react-router, react-markdown, Supabase (facultatif).

```
content/modules/<id>/     contenu pédagogique (données, pas du code)
src/lib/content.ts        découverte automatique des modules (import.meta.glob), chargement à la demande
src/lib/progress.ts       moteur de progression : fonctions pures (état, action) → (nouvel état, résumé)
src/lib/gamification.ts   niveaux, paliers, XP, 24 badges
src/data/repo.ts          stockage : localRepo (navigateur) ou supabaseRepo (cloud)
src/state/                Auth, Store (état utilisateur + sauvegarde différée), Theme
src/components/           Layout, lecteur Markdown, moteur de QCM, célébrations
src/pages/                une page par écran
supabase/schema.sql       tables, RLS, trigger de profil
```

## Principes
- **Contenu = données** : ajouter un module n'exige aucun code.
- **Un seul objet `UserState`** modifié par des fonctions pures → mêmes règles en local et dans le cloud, faciles à tester.
- **Stockage interchangeable** : sans variables Supabase, mode local ; avec, synchronisation + classement. À la première connexion, la progression d'invité est reprise.
- **Sauvegarde différée** (700 ms) + sauvegarde forcée à la fermeture de l'onglet.

## Gamification
- Niveau = 1 + ⌊√(XP/40)⌋ ; 8 paliers (Étincelle ✨ niv. 1 … Soleil ☀️ niv. 26).
- XP par bonne réponse : 10/15/20 selon la difficulté × combo (jusqu'à ×2) + 3 si réponse en moins de 6 s.
- Bonus : QCM parfait +30, ≥ 80 % +15, chapitre lu +25, objectif quotidien (50 XP) +20, badge +20.
- Épreuve : jusqu'à 200 XP la première fois, puis 10 + progression.
- Révision espacée (Leitner) : cases 1 à 5, intervalles 1/3/7/14/30 jours.

## Pistes d'évolution
Validation des scores côté serveur, mode défi entre amis, import de module depuis un fichier, statistiques par question.
