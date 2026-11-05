# Configuration Supabase et déploiement

## 1. Tester en local
```bash
npm install
npm run dev
```
→ http://localhost:5173 (mode local, sans compte).

## 2. Créer le projet Supabase (comptes + classement + synchronisation)
1. Crée un compte sur https://supabase.com puis **New project** (choisis une région proche, ex. Europe ; note le mot de passe de la base).
2. Menu **SQL Editor → New query**, colle le contenu de `supabase/schema.sql`, clique **Run**. (Tables `profiles` et `user_state`, règles de sécurité, création automatique du profil.)
3. Menu **Project Settings → API** : copie **Project URL** et la clé **anon / publishable**.
4. Copie `.env.example` en `.env` et remplis :
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Relance `npm run dev` : l'écran de connexion propose maintenant « Créer un compte ».
6. (Pratique pendant les tests) **Authentication → Providers → Email** : désactive « Confirm email » pour te connecter sans valider de courriel. Réactive-le en production.

> La clé *anon* est publique par conception : la sécurité repose sur les règles RLS du `schema.sql`. Ne mets **jamais** la clé *service_role* dans le projet.

## 3. Mettre en ligne

### Option A — Vercel (recommandé)
1. Pousse le projet sur GitHub (`git init`, `git add .`, `git commit`, `git push`). Le fichier `.gitignore` exclut `node_modules` et `.env`.
2. Sur https://vercel.com : **Add New → Project**, importe le dépôt. Framework détecté : Vite (build `npm run build`, sortie `dist`).
3. **Environment Variables** : ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. `vercel.json` gère les routes (rechargement d'une page sans erreur 404).

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
| Classement vide | normal tant que personne ne s'est connecté avec un compte |

## Limite connue
Les XP sont calculés dans le navigateur : un utilisateur techniquement habile pourrait modifier son score au classement. Acceptable pour un usage entre étudiants ; pour un classement à enjeu, il faudrait valider les scores côté serveur (fonctions Supabase).
