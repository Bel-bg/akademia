# Akademia API

API Express pour le contenu public et la progression des comptes Supabase.

## Commandes

Depuis la racine : `npm run dev:backend`, `npm run backend`, `npm --prefix backend test`.

Le serveur écoute sur `PORT` (4000 par défaut). Le `.env` racine est chargé en développement. En production, fournir `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

## Routes

- `GET /api/health`, `GET /api/modules` et routes de contenu : publiques.
- `GET /api/me`, `GET /api/progress`, `POST /api/progress/actions`, `POST /api/progress/import`, `DELETE /api/progress` et `GET /api/leaderboard` : jeton Supabase requis.

Le backend valide chaque jeton auprès de Supabase Auth. Les appels PostgREST utilisent le jeton utilisateur et les politiques RLS, sans clé `service_role`.
