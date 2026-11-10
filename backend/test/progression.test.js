const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../services/contentService');
const progression = require('../services/progressionService');
const progressStore = require('../services/progressService');
const pushService = require('../services/pushService');

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

test('filiere defines backend theme and is immutable once set', () => {
  const initial = progression.defaultState();
  assert.equal(initial.filiere, null);
  assert.equal(initial.theme, 'ciel');

  const ari = progression.applyAction(initial, { type: 'set-filiere', filiere: 'ARI' }, content);
  assert.equal(ari.state.filiere, 'ARI');
  assert.equal(ari.state.theme, 'ciel');

  // Once set, cannot be modified
  assert.throws(
    () => progression.applyAction(ari.state, { type: 'set-filiere', filiere: 'AIP' }, content),
    /La filière ne peut plus être modifiée une fois choisie/,
  );

  const initial2 = progression.defaultState();
  const aip = progression.applyAction(initial2, { type: 'set-filiere', filiere: 'AIP' }, content);
  assert.equal(aip.state.filiere, 'AIP');
  assert.equal(aip.state.theme, 'violet');

  assert.throws(
    () => progression.applyAction(initial, { type: 'set-filiere', filiere: 'OTHER' }, content),
    /Filière invalide/,
  );
});

test('weekly battle starts monday 00h and ends saturday 18h', () => {
  // Wednesday 12:00 -> active battle
  const wednesday = new Date('2026-11-04T12:00:00.000Z');
  const boundsWed = progression.getBattleWeekBounds(wednesday);
  assert.equal(boundsWed.isFinished, false);
  assert.equal(boundsWed.id, 'battle-2026-11-02');

  // Saturday 17:59 -> active battle
  const satBefore = new Date('2026-11-07T17:59:00.000');
  const boundsSatBefore = progression.getBattleWeekBounds(satBefore);
  assert.equal(boundsSatBefore.isFinished, false);

  // Saturday 18:00 -> finished battle
  const satAfter = new Date('2026-11-07T18:00:00.000');
  const boundsSatAfter = progression.getBattleWeekBounds(satAfter);
  assert.equal(boundsSatAfter.isFinished, true);

  // Sunday 15:00 -> still finished, awaiting next monday
  const sunday = new Date('2026-11-08T15:00:00.000');
  const boundsSun = progression.getBattleWeekBounds(sunday);
  assert.equal(boundsSun.isFinished, true);
  assert.equal(boundsSun.id, 'battle-2026-11-02');
});

test('battle scores are computed from member totals and winner declared at end', () => {
  const users = {
    u1: { filiere: 'ARI', xp: 500 },
    u2: { filiere: 'ARI', xp: 700 },
    u3: { filiere: 'AIP', xp: 1500 },
  };

  // During week: active, no winner yet
  const wednesday = new Date('2026-11-04T12:00:00.000Z');
  const duringWeek = progression.computeBattleScores(users, wednesday);
  assert.equal(duringWeek.ariScore, 1200);
  assert.equal(duringWeek.aipScore, 1500);
  assert.equal(duringWeek.ariMembers, 2);
  assert.equal(duringWeek.aipMembers, 1);
  assert.equal(duringWeek.winner, null);
  assert.equal(duringWeek.status, 'active');

  // Saturday after 18h: completed, winner declared (AIP with 1500 > ARI with 1200)
  const saturdayNight = new Date('2026-11-07T18:01:00.000');
  const completed = progression.computeBattleScores(users, saturdayNight);
  assert.equal(completed.winner, 'AIP');
  assert.equal(completed.status, 'completed');
});

test('Supabase minimal-success responses may be empty', async () => {
  assert.equal(await progressStore.readResponse(new Response(null, { status: 201 })), null);
  assert.deepEqual(await progressStore.readResponse(new Response('[{"ok":true}]', { status: 200 })), [{ ok: true }]);
});

test('ranking notifications target only players passed by the moving player', () => {
  const before = ['a', 'b', 'c', 'me', 'd'].map((id) => ({ id }));
  const after = ['a', 'me', 'b', 'c', 'd'].map((id) => ({ id }));

  assert.deepEqual(progressStore.overtakenPlayerIds(before, after, 'me'), ['b', 'c']);
  assert.deepEqual(progressStore.overtakenPlayerIds(before, before, 'me'), []);
});

test('push subscriptions reject non-HTTPS endpoints before storage', async () => {
  await assert.rejects(pushService.saveSubscription('user-id', { endpoint: 'http://example.test', keys: {} }), (error) => error.status === 400);
});

test('user account and progress persist across signout, session refresh, and signin', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const dbPath = path.resolve(__dirname, '../data/db.json');
  const originalDb = fs.existsSync(dbPath) ? fs.readFileSync(dbPath, 'utf8') : null;

  try {
    const uniqueSuffix = Date.now().toString(36);
    const email = `persist_${uniqueSuffix}@akademia.test`;
    const username = `user_${uniqueSuffix}`.slice(0, 20);
    const password = 'secretPassword123';

    // 1. Sign up
    const signup = await progressStore.signUpUser({
      email,
      password,
      username,
      filiere: 'AIP',
    });
    assert.ok(signup.token);
    assert.equal(signup.user.username, username);
    assert.equal(signup.user.filiere, 'AIP');
    assert.equal(signup.user.theme, 'violet');

    // 2. Apply and save progress
    const chapterId = moduleMeta.chapters[0].id;
    const progressed = progression.applyAction(
      signup.state,
      { type: 'chapter-read', moduleId: moduleMeta.id, chapterId },
      content,
    );
    const savedState = await progressStore.saveProgress(
      signup.token,
      signup.user.id,
      progressed.state,
    );
    assert.ok(savedState.xp > 0);
    assert.deepEqual(savedState.chaptersRead[moduleMeta.id], [chapterId]);

    // 3. Sign out
    await progressStore.signOutUser(signup.token);

    // 4. Sign back in and verify account + progress are intact
    const signin = await progressStore.signInUser({ email, password });
    assert.equal(signin.user.id, signup.user.id);
    assert.equal(signin.user.username, username);
    assert.equal(signin.user.filiere, 'AIP');
    assert.equal(signin.state.xp, savedState.xp);
    assert.deepEqual(signin.state.chaptersRead[moduleMeta.id], [chapterId]);

    // 5. Refresh session and verify loadProgress still returns full state
    const refreshed = await progressStore.refreshUserSession(signin.refreshToken);
    assert.ok(refreshed.token);
    const loadedAfterRefresh = await progressStore.loadProgress(refreshed.token, signin.user.id);
    assert.equal(loadedAfterRefresh.xp, savedState.xp);
    assert.deepEqual(loadedAfterRefresh.chaptersRead[moduleMeta.id], [chapterId]);
  } finally {
    if (originalDb !== null) {
      fs.writeFileSync(dbPath, originalDb, 'utf8');
    }
  }
});

test('formation lessons reward XP once and the last lesson completes the formation', () => {
  const formation = content.getFormations('bdd-oracle')[0];
  assert.ok(formation && formation.lessons.length > 1);
  let state = progression.defaultState();
  let total = 0;
  for (const lesson of formation.lessons) {
    const result = progression.applyAction(state, { type: 'formation-lesson', moduleId: 'bdd-oracle', formationId: formation.id, lessonId: lesson.id }, content);
    assert.ok(result.summary.xp >= 20);
    total += result.summary.xp;
    state = result.state;
  }
  assert.equal(state.counters.formations, 1);
  assert.ok(state.badges['formation-1']);
  const again = progression.applyAction(state, { type: 'formation-lesson', moduleId: 'bdd-oracle', formationId: formation.id, lessonId: formation.lessons[0].id }, content);
  assert.equal(again.summary, null);
  assert.equal(again.state.xp, state.xp);
  assert.throws(() => progression.applyAction(state, { type: 'formation-lesson', moduleId: 'bdd-oracle', formationId: formation.id, lessonId: 'faux' }, content));
  assert.ok(total > 0);
});
