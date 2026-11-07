# Architecture

**Stack** : React 18, Vite, TypeScript strict, Tailwind, Express, Supabase Auth/Postgres.

```
frontend/src/             application React, contenu et vues
frontend/src/data/repo.ts client local invité et client de l’API authentifiée
backend/server.js         API Express, authentification des requêtes Supabase
backend/services/         contenu, validation des réponses et progression métier
frontend/supabase/schema.sql  profils, progression privée, RLS et trigger de profil
```

## Principes
- **Contenu = données** : ajouter un module n'exige aucun code.
- **Invité** : progression locale dans `localStorage`.
- **Compte** : actions envoyées à Express avec le jeton Supabase; l’API vérifie la session, recalcule les récompenses et écrit sous RLS.
- **Contenu statique** : modules et cours lus par le backend depuis `frontend/content/modules`.
- **Configuration locale** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` à la racine; le backend utilise ces mêmes valeurs ou `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

## Gamification
- Niveau = 1 + ⌊√(XP/40)⌋ ; 8 paliers (Étincelle ✨ niv. 1 … Soleil ☀️ niv. 26).
- XP par bonne réponse : 10/15/20 selon la difficulté × combo (jusqu'à ×2) + 3 si réponse en moins de 6 s.
- Bonus : QCM parfait +30, ≥ 80 % +15, chapitre lu +25, objectif quotidien (50 XP) +20, badge +20.
- Épreuve : jusqu'à 200 XP la première fois, puis 10 + progression.
- Révision espacée (Leitner) : cases 1 à 5, intervalles 1/3/7/14/30 jours.

## Limites
- Les notes d’examen sont auto-évaluées par l’étudiant et bornées au barème du contenu.
- Le démarrage local commun est `npm run dev`; le backend écoute sur le port 4000 et Vite proxy `/api`.
- En production, le frontend et le backend doivent être déployés séparément et `VITE_API_BASE_URL` doit pointer sur l’API.
