# Configuration Supabase et déploiement

## 1. Tester en local
```bash
npm run setup
npm run dev
```
→ http://localhost:5173, API sur http://localhost:4000.

## 2. Créer le projet Supabase (comptes + classement + synchronisation)
1. Crée un compte sur https://supabase.com puis **New project** (choisis une région proche, ex. Europe ; note le mot de passe de la base).
2. Menu **SQL Editor → New query**, colle le contenu de `frontend/supabase/schema.sql`, clique **Run**. (Profils, progression, messages, reçus d’actions idempotentes, abonnements push, règles RLS et activation Realtime.)
3. Menu **Project Settings → API** : copie **Project URL** et la clé **anon / publishable**.
4. Crée `.env` à la racine et remplis :
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Relance `npm run dev` : l'écran de connexion propose maintenant « Créer un compte ».
6. (Pratique pendant les tests) **Authentication → Providers → Email** : désactive « Confirm email » pour te connecter sans valider de courriel. Réactive-le en production.

Les comptes, la progression, le classement et les notifications passent par Express. En local, le serveur lit les variables à la racine. Les clés serveur ne doivent jamais être exposées au frontend.

> La clé *anon* est publique par conception : la sécurité repose sur les règles RLS du schéma. La clé *service_role* est réservée au backend Render.

## 3. Mettre en ligne

### Déployer le frontend et l’API
1. Déploie le dépôt entier sur un hôte Node.js (Render, Railway ou équivalent), en laissant **Root Directory** vide. Le backend lit aussi les cours dans `frontend/content`.
2. Sur Render, utilise `npm install` comme commande de build et `npm --prefix backend start` comme commande de démarrage.
3. Configure sur le backend `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` et `VAPID_SUBJECT`. L’hébergeur fournit `PORT`.
4. Déploie le frontend sur Vercel ou Netlify avec la commande racine `npm run build` et le dossier de sortie `frontend/dist`.
5. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_API_BASE_URL=https://adresse-de-ton-api/api` pour le frontend.
6. Autorise le domaine frontend dans les URL de redirection Supabase. L’API accepte les appels CORS; ses routes de progression exigent toujours un jeton utilisateur valide.

### Notifications Web Push
1. Génère une paire VAPID depuis la racine avec `npm --prefix backend exec -- web-push generate-vapid-keys`.
2. Ajoute les clés VAPID et `SUPABASE_SERVICE_ROLE_KEY` uniquement dans les variables du service Render. Utilise `VAPID_SUBJECT=mailto:admin@ton-domaine.fr`; ne mets jamais ces secrets dans Vercel.
3. Exécute `frontend/supabase/schema.sql` dans Supabase pour créer `push_subscriptions` et activer les messages temps réel.
4. Après le déploiement, connecte-toi au site en HTTPS et clique sur l’icône de cloche pour autoriser les notifications dans le navigateur. Les push sont envoyés pour les nouveaux messages et les joueurs dépassés au classement.

La clé `service_role` contourne RLS : elle doit rester uniquement dans les variables du backend Render. Le backend ne l’expose dans aucune réponse API.

Le service worker conserve le shell de l’application, les cours et les banques de QCM déjà préchargés; les actions de progression hors ligne sont gardées dans le stockage local du navigateur jusqu’au rejeu authentifié.

### Option B — Netlify
Même principe : **Add new site → Import from Git**, build `npm run build`, dossier `frontend/dist`, mêmes variables. `frontend/public/_redirects` gère les routes.

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
| Cloche indisponible | vérifie `pushConfigured: true` sur `/api/health`, le schéma Supabase et l’autorisation des notifications du navigateur |

## Mise à niveau du schéma
Exécute `frontend/supabase/schema.sql` dans le SQL Editor Supabase. Le script est réexécutable et ajoute aussi la table `messages`, ses règles d’accès et l’activation Realtime nécessaire au chat.
