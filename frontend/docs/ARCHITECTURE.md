# Architecture.

**Stack** : React 18, Vite, TypeScript strict, Tailwind, Express, Supabase Auth/Postgres.

```
frontend/src/             application React, contenu et vues
frontend/src/data/repo.ts client local invité et client de l’API authentifiée
backend/server.js         API Express, authentification des requêtes Supabase
backend/services/         contenu, validation des réponses et progression métier
frontend/src/data/social.ts  profils publics, conversations et messages temps réel
frontend/supabase/schema.sql profils, progression privée, messagerie et règles RLS
```

## Principes.
- **Contenu = données** : ajouter un module n'exige aucun code.
- **Invité** : progression locale dans `localStorage`.
- **Compte** : actions envoyées à Express avec le jeton Supabase; l’API vérifie la session, recalcule les récompenses et écrit sous RLS.
- **Hors ligne** : le service worker met en cache l’application, les cours et les QCM; la progression des comptes reste visible localement puis est rejouée dans l’ordre au retour du réseau.
- **Idempotence** : chaque action en attente possède un UUID; `progress_action_receipts` évite de créditer deux fois une action dont la réponse réseau a été perdue.
- **Profils et messages** : seuls les champs de profil publics sont affichés; les messages sont limités à leurs deux participants par RLS et diffusés par Supabase Realtime. Chaque suppression propose le masquage personnel ou l’effacement définitif pour les deux participants.
- **Web Push** : un service worker affiche les notifications. Le backend utilise VAPID et une clé `service_role` conservée côté serveur pour gérer les abonnements; l’envoi de messages est authentifié via Express.
- **Contenu statique** : modules et cours lus par le backend depuis `frontend/content/modules`.
- **Configuration locale** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` à la racine; le backend utilise ces mêmes valeurs ou `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

## Gamification
- Niveau = 1 + ⌊√(XP/40)⌋ ; 8 paliers (Étincelle ✨ niv. 1 … Soleil ☀️ niv. 26).
- XP par bonne réponse : 10/15/20 selon la difficulté × combo (jusqu'à ×2) + 3 si réponse en moins de 6 s.
- Bonus : QCM parfait +30, ≥ 80 % +15, chapitre lu +25, objectif quotidien (50 XP) +20, badge +20.
- Épreuve : jusqu'à 200 XP la première fois, puis 10 + progression.
- Révision espacée (Leitner) : cases 1 à 5, intervalles 1/3/7/14/30 jours.

## Formations coachées

Une *formation* est un parcours thématique court (ex. « Tout savoir sur le SELECT ») rattaché à un module.

- Contenu : `frontend/content/modules/<module>/formations/<id>.json` (un fichier par formation, `id` = nom du fichier).
  Champs : `title`, `tagline`, `emoji`, `color`, `level`, `minutes`, `order`, `pitch[]` (dialogue d'accueil de Nimbo), `benefits[]`, `lessons[]`.
  Une leçon contient des `steps` : `say` (bulle du coach, markdown), `code` (bloc SQL), `choice` (QCM instantané), `exercise` (requête libre comparée à `solution` + `accept[]` après normalisation, avec `hints[]`).
- API : `GET /api/modules/:id/formations` (repli local via `import.meta.glob`).
- Progression : action `formation-lesson` (`moduleId`, `formationId`, `lessonId`) ; XP serveur 20 par leçon + 60 à la fin de la formation ; état `formations["module:formation"] = [leçons]` ; compteur `counters.formations` ; badges `formation-1` et `formation-3`.
- UI : `FormationShowcase` (nuage à lunettes qui annonce les titres, puis discussion de présentation si plusieurs formations), `FormationPage` (parcours), `FormationLessonPage` (lecteur de leçon façon chat).
- `npm run validate` vérifie la structure des formations.

## Limites
- Les notes d’examen sont auto-évaluées par l’étudiant et bornées au barème du contenu.
- Le démarrage local commun est `npm run dev`; le backend écoute sur le port 4000 et Vite proxy `/api`.
- En production, le frontend et le backend doivent être déployés séparément et `VITE_API_BASE_URL` doit pointer sur l’API.
