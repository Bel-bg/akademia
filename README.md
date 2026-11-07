# Akademia

Plateforme d’apprentissage modulaire avec une application React/Vite, une API Express, une authentification Supabase et une progression sauvegardée dans Postgres.

## Structure

- `frontend/` : interface, contenus de cours et mode invité local
- `backend/` : API, validation des activités et logique de progression des comptes
- `frontend/supabase/schema.sql` : tables, politiques RLS et profil à l’inscription

## Installation

Copie `.env.example` vers `.env`, renseigne les variables Supabase, puis exécute :

```bash
npm run setup
npm run dev
```

Le frontend est accessible sur http://localhost:5173 et l’API sur http://localhost:4000.

## Commandes racine

```bash
npm run dev
npm run build
npm run preview
npm run validate
npm run new-module
npm run backend
npm test
```

## Documentation technique

La documentation technique du contenu et de l’architecture est conservée dans le dossier frontend :

- `frontend/docs/ARCHITECTURE.md`
- `frontend/docs/DEPLOIEMENT.md`
- `frontend/docs/AJOUTER_UN_MODULE.md`
