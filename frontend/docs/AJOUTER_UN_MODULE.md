# Ajouter un module de cours

Un module = un dossier dans `content/modules/`. Aucun code à modifier : il apparaît automatiquement dans le menu, l'accueil, les résultats et les succès.

## 1. Créer le squelette
```bash
npm run new-module -- reseaux "Réseaux informatiques"
```

## 2. Structure
```
content/modules/reseaux/
├── module.json          # titre, couleur, parties, liste des chapitres, fonctionnalités
├── chapters/*.md        # un fichier Markdown par chapitre
├── quiz.json            # questions QCM
├── flashcards.json      # cartes mémoire
├── exams-index.json     # liste des épreuves (facultatif)
└── exams/e01.json …     # épreuves (e01, e02…)
public/figures/reseaux/  # images/schémas du cours
```

## 3. Écrire un chapitre (Markdown)
- Titres `##` et `###` : ils alimentent le sommaire latéral.
- Tableaux, listes, gras, code : Markdown standard.
- Images : `![Légende](/figures/reseaux/schema.svg)`
- Encadrés : 
  ```
  :::retenir Titre facultatif
  Contenu…
  :::
  ```
  Types : `retenir`, `exemple`, `attention`, `examen`.

## 4. Formats JSON
**QCM** (`quiz.json`) — `answer` = index (à partir de 0) de la bonne option, `difficulty` = 1, 2 ou 3 :
```json
{ "id": "q01", "chapter": "1-1-introduction", "difficulty": 1, "q": "Question ?",
  "options": ["A", "B", "C", "D"], "answer": 1, "explain": "Pourquoi B." }
```
**Carte** : `{ "id": "f01", "front": "Terme ?", "back": "Définition", "tag": "Glossaire" }`

**Épreuve** : `{ "n": 1, "title": "...", "durationMinutes": 120, "points": 20, "parts": [{ "id": "p1", "title": "...", "points": 5, "intro": "...", "context": "(scénario, facultatif)", "questions": [{ "id": "e01p1q1", "q": "...", "a": "corrigé", "points": 1 }] }] }`
Dans `exams-index.json` : `{ "n": 1, "title": "...", "scenario": "...", "cas": "...", "durationMinutes": 120, "points": 20 }`.

## 5. Vérifier
```bash
npm run validate
```
Le script signale les identifiants dupliqués, chapitres inconnus, réponses hors limites, barèmes incohérents, images manquantes, encadrés non fermés.

## 6. Publier
`git push` : le site se redéploie.

**Astuce** : tu peux demander à Claude de transformer un cours (PDF, notes) en module : donne-lui ce document et le format ci-dessus.
