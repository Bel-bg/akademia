// Vérifie la cohérence du contenu : node scripts/validate-content.mjs  (npm run validate)
import fs from 'node:fs';
import path from 'node:path';

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const root = fs.existsSync(path.resolve('content/modules')) ? path.resolve('content/modules') : path.resolve(scriptDir, '../content/modules');
const publicDir = fs.existsSync(path.resolve('public')) ? path.resolve('public') : path.resolve(scriptDir, '../public');
let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('  ✗ ' + m); };
const warn = (m) => { warns++; console.log('  ! ' + m); };
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { err(`${f} : JSON invalide (${e.message})`); return null; } };

if (!fs.existsSync(root)) { console.log('Aucun dossier content/modules'); process.exit(1); }
const ids = new Set();

for (const dir of fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const base = path.join(root, dir.name);
  console.log(`\nModule « ${dir.name} »`);
  const mf = path.join(base, 'module.json');
  if (!fs.existsSync(mf)) { err('module.json manquant'); continue; }
  const m = readJson(mf); if (!m) continue;
  if (m.id !== dir.name) err(`id "${m.id}" ≠ nom du dossier "${dir.name}"`);
  if (ids.has(m.id)) err(`id dupliqué : ${m.id}`); ids.add(m.id);
  for (const k of ['title', 'subtitle', 'description', 'emoji', 'color', 'chapters', 'parts', 'features']) if (m[k] === undefined) err(`module.json : champ "${k}" manquant`);

  const chapIds = new Set();
  for (const c of m.chapters ?? []) {
    if (chapIds.has(c.id)) err(`chapitre dupliqué : ${c.id}`); chapIds.add(c.id);
    if (!fs.existsSync(path.join(base, 'chapters', c.file))) err(`fichier de chapitre introuvable : chapters/${c.file}`);
  }
  for (const p of m.parts ?? []) for (const cid of p.chapters) if (!chapIds.has(cid)) err(`partie "${p.id}" : chapitre inconnu "${cid}"`);
  console.log(`  ${chapIds.size} chapitres`);

  const mdFiles = fs.existsSync(path.join(base, 'chapters')) ? fs.readdirSync(path.join(base, 'chapters')).filter((f) => f.endsWith('.md')) : [];
  for (const f of mdFiles) {
    const txt = fs.readFileSync(path.join(base, 'chapters', f), 'utf8');
    if (!m.chapters.some((c) => c.file === f)) warn(`chapters/${f} n'est référencé par aucun chapitre`);
    const opens = (txt.match(/^:::(retenir|exemple|attention|examen)/gm) || []).length;
    const closes = (txt.match(/^:::\s*$/gm) || []).length;
    if (opens !== closes) err(`chapters/${f} : encadrés non fermés (${opens} ouverts, ${closes} fermés)`);
    for (const im of txt.matchAll(/!\[[^\]]*\]\((\/[^)]+)\)/g)) if (!fs.existsSync(path.join(publicDir, im[1]))) err(`chapters/${f} : image introuvable ${im[1]}`);
  }

  const qf = path.join(base, 'quiz.json');
  if (fs.existsSync(qf)) {
    const qs = readJson(qf) ?? []; const qid = new Set();
    qs.forEach((q) => {
      if (qid.has(q.id)) err(`QCM : id dupliqué ${q.id}`); qid.add(q.id);
      if (!chapIds.has(q.chapter)) err(`QCM ${q.id} : chapitre inconnu "${q.chapter}"`);
      if (!Array.isArray(q.options) || q.options.length < 2) err(`QCM ${q.id} : options invalides`);
      else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err(`QCM ${q.id} : "answer" hors limites`);
      if (![1, 2, 3].includes(q.difficulty)) err(`QCM ${q.id} : difficulty doit valoir 1, 2 ou 3`);
      if (!q.explain) warn(`QCM ${q.id} : pas d'explication`);
    });
    console.log(`  ${qs.length} questions QCM`);
  } else if (m.features?.quiz) err('features.quiz activé mais quiz.json absent');

  const ff = path.join(base, 'flashcards.json');
  if (fs.existsSync(ff)) { const cs = readJson(ff) ?? []; const s = new Set(); cs.forEach((c) => { if (s.has(c.id)) err(`carte dupliquée ${c.id}`); s.add(c.id); if (!c.front || !c.back) err(`carte ${c.id} incomplète`); }); console.log(`  ${cs.length} cartes`); }
  else if (m.features?.flashcards) err('features.flashcards activé mais flashcards.json absent');

  const ef = path.join(base, 'exams-index.json');
  if (fs.existsSync(ef)) {
    const idx = readJson(ef) ?? [];
    for (const e of idx) {
      const f = path.join(base, 'exams', `e${String(e.n).padStart(2, '0')}.json`);
      if (!fs.existsSync(f)) { err(`épreuve ${e.n} : fichier ${path.basename(f)} manquant`); continue; }
      const ex = readJson(f); if (!ex) continue;
      const sum = ex.parts.reduce((t, p) => t + p.points, 0);
      if (sum !== ex.points) err(`épreuve ${e.n} : somme des parties (${sum}) ≠ total (${ex.points})`);
      for (const p of ex.parts) { const qs = p.questions.reduce((t, q) => t + q.points, 0); if (Math.abs(qs - p.points) > 0.001) err(`épreuve ${e.n}, ${p.id} : questions = ${qs} pts ≠ ${p.points}`); }
    }
    console.log(`  ${idx.length} épreuves`);
  } else if (m.features?.exams) err('features.exams activé mais exams-index.json absent');

  const fdir = path.join(base, 'formations');
  if (fs.existsSync(fdir)) {
    const fids = new Set();
    for (const file of fs.readdirSync(fdir).filter((x) => x.endsWith('.json'))) {
      const f = readJson(path.join(fdir, file)); if (!f) continue;
      if (f.id !== file.replace(/\.json$/, '')) err(`formation ${file} : id "${f.id}" ≠ nom du fichier`);
      if (fids.has(f.id)) err(`formation dupliquée : ${f.id}`); fids.add(f.id);
      for (const k of ['title', 'tagline', 'emoji', 'color', 'level', 'minutes', 'pitch', 'benefits', 'lessons']) if (f[k] === undefined) err(`formation ${f.id} : champ "${k}" manquant`);
      const lids = new Set(); let exos = 0;
      for (const l of f.lessons ?? []) {
        if (lids.has(l.id)) err(`formation ${f.id} : leçon dupliquée ${l.id}`); lids.add(l.id);
        if (!l.steps?.length) err(`formation ${f.id}/${l.id} : aucune étape`);
        (l.steps ?? []).forEach((st, i) => {
          const where = `formation ${f.id}/${l.id} étape ${i + 1}`;
          if (st.type === 'say' && !st.text) err(`${where} : texte vide`);
          else if (st.type === 'code' && !st.sql) err(`${where} : code vide`);
          else if (st.type === 'choice') { if (!Array.isArray(st.options) || st.options.length < 2 || !Number.isInteger(st.answer) || st.answer < 0 || st.answer >= st.options.length) err(`${where} : choix invalide`); if (!st.explain) err(`${where} : explication manquante`); }
          else if (st.type === 'exercise') { exos++; if (!st.solution || !st.hints?.length || !st.explain) err(`${where} : exercice incomplet (solution, hints, explain)`); }
          else if (!['say', 'code'].includes(st.type)) err(`${where} : type inconnu "${st.type}"`);
        });
      }
      console.log(`  formation « ${f.id} » : ${(f.lessons ?? []).length} leçons, ${exos} exercices`);
    }
  }
}
console.log(`\n${errors ? '✗' : '✓'} ${errors} erreur(s), ${warns} avertissement(s)`);
process.exit(errors ? 1 : 0);
