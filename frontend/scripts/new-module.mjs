// Crée le squelette d'un nouveau module : npm run new-module -- reseaux "Réseaux informatiques"
import fs from 'node:fs';
import path from 'node:path';

const [id, ...rest] = process.argv.slice(2);
const title = rest.join(' ') || id;
if (!id || !/^[a-z0-9-]+$/.test(id)) { console.log('Usage : npm run new-module -- <id-en-minuscules> "<Titre du module>"'); process.exit(1); }
const dir = path.resolve('content/modules', id);
if (fs.existsSync(dir)) { console.log(`Le module « ${id} » existe déjà.`); process.exit(1); }
fs.mkdirSync(path.join(dir, 'chapters'), { recursive: true });
fs.mkdirSync(path.join(dir, 'exams'), { recursive: true });
fs.mkdirSync(path.resolve('public/figures', id), { recursive: true });
const w = (f, d) => fs.writeFileSync(path.join(dir, f), typeof d === 'string' ? d : JSON.stringify(d, null, 2) + '\n');

w('module.json', {
  id, title, subtitle: 'Sous-titre · Établissement · Niveau', description: 'Décris le module en une ou deux phrases.',
  emoji: '📘', color: '#6366F1', level: 'Licence', estimatedHours: 6,
  parts: [{ id: 'p1', title: 'Chapitre 1 · À renommer', chapters: ['1-1-introduction'] }],
  chapters: [{ id: '1-1-introduction', number: '1.1', title: 'Introduction', summary: 'Résumé en une phrase.', minutes: 5, file: '1-1-introduction.md' }],
  features: { quiz: true, blitz: true, exams: false, flashcards: true },
});
w('chapters/1-1-introduction.md', `## 1.1.1 Premier titre

Écris ton cours en Markdown. Les tableaux, listes, **gras** et images (\`![légende](/figures/${id}/schema.svg)\`) sont pris en charge.

:::retenir Idée clé
Un encadré « À retenir ». Autres types : exemple, attention, examen.
:::
`);
w('quiz.json', [{ id: 'q01', chapter: '1-1-introduction', difficulty: 1, q: 'Question ?', options: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'], answer: 1, explain: "Pourquoi B est correcte." }]);
w('flashcards.json', [{ id: 'f01', front: 'Terme ?', back: 'Définition.', tag: 'Glossaire' }]);
w('exams-index.json', []);
console.log(`✓ Module « ${id} » créé dans content/modules/${id}\n  Édite module.json, ajoute tes chapitres, puis lance : npm run validate`);
