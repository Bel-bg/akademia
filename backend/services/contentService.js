const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '../../frontend');
const contentRoot = path.join(frontendRoot, 'content', 'modules');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validModuleId(moduleId) {
  return typeof moduleId === 'string' && /^[a-z0-9][a-z0-9-]*$/i.test(moduleId);
}

function listModules() {
  const entries = fs.existsSync(contentRoot) ? fs.readdirSync(contentRoot, { withFileTypes: true }) : [];
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function getModulePath(moduleId) {
  if (!validModuleId(moduleId)) return null;
  return path.join(contentRoot, moduleId, 'module.json');
}

function moduleExists(moduleId) {
  const filePath = getModulePath(moduleId);
  return Boolean(filePath && fs.existsSync(filePath));
}

function getModules() {
  return listModules().map((moduleId) => readJson(getModulePath(moduleId))).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
}

function getModule(moduleId) {
  if (!moduleExists(moduleId)) return null;
  return readJson(getModulePath(moduleId));
}

function getChapter(moduleId, chapterFile) {
  if (!moduleExists(moduleId) || typeof chapterFile !== 'string' || path.basename(chapterFile) !== chapterFile || !chapterFile.endsWith('.md')) return null;
  const filePath = path.join(contentRoot, moduleId, 'chapters', chapterFile);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function getQuiz(moduleId) {
  if (!moduleExists(moduleId)) return [];
  const filePath = path.join(contentRoot, moduleId, 'quiz.json');
  return fs.existsSync(filePath) ? readJson(filePath) : [];
}

function getCards(moduleId) {
  if (!moduleExists(moduleId)) return [];
  const filePath = path.join(contentRoot, moduleId, 'flashcards.json');
  return fs.existsSync(filePath) ? readJson(filePath) : [];
}

function getExamIndex(moduleId) {
  if (!moduleExists(moduleId)) return [];
  const filePath = path.join(contentRoot, moduleId, 'exams-index.json');
  return fs.existsSync(filePath) ? readJson(filePath) : [];
}

function getExam(moduleId, examNumber) {
  if (!moduleExists(moduleId) || !Number.isInteger(Number(examNumber)) || Number(examNumber) < 1) return null;
  const filePath = path.join(contentRoot, moduleId, 'exams', `e${String(Number(examNumber)).padStart(2, '0')}.json`);
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function getFormations(moduleId) {
  if (!moduleExists(moduleId)) return [];
  const dir = path.join(contentRoot, moduleId, 'formations');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => readJson(path.join(dir, file)))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

module.exports = {
  getFormations,
  getModules,
  getModule,
  getChapter,
  getQuiz,
  getCards,
  getExamIndex,
  getExam,
};
