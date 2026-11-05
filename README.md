# Akademia — plateforme d'apprentissage gamifiée

Lis tes cours, entraîne-toi en QCM, passe des épreuves complètes, gagne de l'XP, monte en « puissance » (Étincelle → Soleil) et débloque des badges. Conçue pour accueillir **autant de modules que tu veux**.

Premier module inclus : **Internet des Objets** (12 chapitres, 192 QCM, 286 cartes mémoire, 50 épreuves).

## Démarrage rapide (5 minutes)

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent.

```bash
npm install
npm run dev
```
Ouvre http://localhost:5173. Sans configuration, l'application fonctionne en **mode local** : la progression est enregistrée dans le navigateur.

## Fonctionnalités
- Lecteur de cours (sommaire, progression, taille de texte, encadrés pédagogiques)
- QCM filtrables (chapitre / difficulté / nombre), défi éclair (90 s, 3 vies), révision espacée (Leitner)
- 50 épreuves au format examen : rédaction, chrono optionnel de 2 h, corrigé, auto-évaluation
- Cartes mémoire, résultats détaillés, 24 badges, 8 paliers de puissance, série quotidienne, objectif du jour
- Mode sombre, mobile, comptes + classement (avec Supabase)

## Commandes
| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | vérification TypeScript + build de production (`dist/`) |
| `npm run preview` | prévisualiser le build |
| `npm run validate` | contrôler la cohérence du contenu |
| `npm run new-module -- id "Titre"` | créer le squelette d'un module |

## Documentation
- [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) — Supabase + mise en ligne (Vercel / Netlify)
- [docs/AJOUTER_UN_MODULE.md](docs/AJOUTER_UN_MODULE.md) — ajouter un cours
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — structure technique
