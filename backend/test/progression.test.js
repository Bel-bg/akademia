const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../services/contentService');
const progression = require('../services/progressionService');
const progressStore = require('../services/progressService');

const moduleMeta = content.getModules()[0];

test('quiz answer is recomputed from server content', () => {
  const question = content.getQuiz(moduleMeta.id)[0];
  const valid = progression.applyAction(progression.defaultState(), {
    type: 'quiz', moduleId: moduleMeta.id, kind: 'qcm', label: 'Test',
    results: [{ id: question.id, answerIndex: question.answer, elapsedSeconds: 10 }],
  }, content);
  const forged = progression.applyAction(progression.defaultState(), {
    type: 'quiz', moduleId: moduleMeta.id, kind: 'qcm', label: 'Test',
    results: [{ id: question.id, answerIndex: (question.answer + 1) % question.options.length, elapsedSeconds: 10 }],
  }, content);

  assert.equal(valid.summary.score, 1);
  assert.equal(forged.summary.score, 0);
  assert.notEqual(valid.state.attempts[0].xp, 0);
});

test('chapter completion rewards XP only once', () => {
  const chapterId = moduleMeta.chapters[0].id;
  const first = progression.applyAction(progression.defaultState(), {
    type: 'chapter-read', moduleId: moduleMeta.id, chapterId,
  }, content);
  const second = progression.applyAction(first.state, {
    type: 'chapter-read', moduleId: moduleMeta.id, chapterId,
  }, content);

  assert.equal(first.summary.lines.find((line) => line.label === 'Chapitre terminé')?.xp, 25);
  assert.equal(second.summary, null);
  assert.equal(second.state.xp, first.state.xp);
});

test('exam score cannot exceed the published maximum', () => {
  const exam = content.getExam(moduleMeta.id, 1);
  if (!exam) return;
  assert.throws(() => progression.applyAction(progression.defaultState(), {
    type: 'exam', moduleId: moduleMeta.id, n: exam.n, score: exam.points + 1,
  }, content), /Note invalide/);
});

test('legacy import rebuilds rewards instead of trusting stored XP', () => {
  const imported = progression.importLegacyState({
    xp: 999999999,
    badges: { 'level-20': new Date().toISOString() },
    chaptersRead: { [moduleMeta.id]: [moduleMeta.chapters[0].id] },
    examBest: {},
  }, content);

  assert.equal(imported.xp, 45);
  assert.equal(imported.badges['level-20'], undefined);
});

test('content service rejects traversal paths', () => {
  assert.equal(content.getChapter('../backend', 'server.js'), null);
  assert.equal(content.getModule('../backend'), null);
});

test('Supabase minimal-success responses may be empty', async () => {
  assert.equal(await progressStore.readResponse(new Response(null, { status: 201 })), null);
  assert.deepEqual(await progressStore.readResponse(new Response('[{"ok":true}]', { status: 200 })), [{ ok: true }]);
});