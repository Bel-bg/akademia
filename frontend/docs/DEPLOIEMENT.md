# Configuration Supabase et déploiement

## 1. Tester en local
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
npm run dev
```
→ http://localhost:5173, API sur http://localhost:4000.

## 2. Créer le projet Supabase (comptes + classement + synchronisation)
1. Crée un compte sur https://supabase.com puis **New project** (choisis une région proche, ex. Europe ; note le mot de passe de la base).
2. Menu **SQL Editor → New query**, colle le contenu de `supabase/schema.sql`, clique **Run**. (Tables `profiles` et `user_state`, règles de sécurité, création automatique du profil.)
3. Menu **Project Settings → API** : copie **Project URL** et la clé **anon / publishable**.
4. Copie `.env.example` en `.env` à la racine et remplis :
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Relance `npm run dev` : l'écran de connexion propose maintenant « Créer un compte ».
6. (Pratique pendant les tests) **Authentication → Providers → Email** : désactive « Confirm email » pour te connecter sans valider de courriel. Réactive-le en production.

Les comptes, la progression et le classement passent par Express. En local, le serveur lit ces variables à la racine. En production, configure également `SUPABASE_URL` et `SUPABASE_ANON_KEY` sur le service backend. Ne configure jamais `service_role`.

> La clé *anon* est publique par conception : la sécurité repose sur les règles RLS du `schema.sql`. Ne mets **jamais** la clé *service_role* dans le projet.

## 3. Mettre en ligne

### Déployer le frontend et l’API
1. Déploie `backend/` sur un hôte Node.js (Render, Railway ou équivalent), avec `npm install` dans ce dossier et la commande de démarrage `npm start`.
2. Configure sur le backend `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `PORT` si l’hébergeur le requiert.
3. Déploie le frontend sur Vercel ou Netlify avec la commande racine `npm run build` et le dossier de sortie `frontend/dist`.
4. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_API_BASE_URL=https://adresse-de-ton-api/api` pour le frontend.
5. Autorise le domaine frontend dans les URL de redirection Supabase. L’API accepte les appels CORS; ses routes de progression exigent toujours un jeton utilisateur valide.

### Option B — Netlify
Même principe : **Add new site → Import from Git**, build `npm run build`, dossier `dist`, mêmes variables. `public/_redirects` gère les routes.

## 4. Autoriser ton site dans Supabase (indispensable pour les comptes)
**Authentication → URL Configuration** :
- **Site URL** : l'adresse de ton site (ex. `https://akademia.vercel.app`)
- **Redirect URLs** : ajoute cette adresse et `http://localhost:5173`

Sans cela, les liens de confirmation d'e-mail et de réinitialisation de mot de passe pointent au mauvais endroit.

## 5. Nom de domaine (facultatif)
Vercel/Netlify : **Settings → Domains → Add**, puis suis les instructions DNS. Mets ensuite à jour la *Site URL* Supabase.

## 6. Mises à jour
Chaque `git push` redéploie automatiquement. Pour ajouter du contenu, voir `AJOUTER_UN_MODULE.md`.

## Dépannage
| Symptôme | Cause probable |
|---|---|
| Écran blanc après déploiement | variables d'environnement absentes, ou build en erreur (voir les logs) |
| 404 en rechargeant une page | règle de réécriture absente (`vercel.json` / `_redirects`) |
| « Ce pseudo est déjà pris » | pseudo non unique (insensible à la casse) |
| E-mail de confirmation introuvable | vérifie les spams ; en test, désactive « Confirm email » |
| Classement inaccessible | vérifie que l’utilisateur est connecté et que le backend possède les variables Supabase |

## Mise à niveau du schéma
Exécute `frontend/supabase/schema.sql` dans le SQL Editor Supabase. Les tables `profiles` et `user_state`, leurs politiques RLS et le déclencheur d’inscription sont nécessaires à l’API.
