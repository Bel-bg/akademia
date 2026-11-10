const test = require('node:test');
const assert = require('node:assert/strict');
const adminService = require('../services/adminService');
const app = require('../server');

test('adminService.getAdminStats computes exhaustive statistics across modules and users without mocks or emojis', async () => {
  const stats = await adminService.getAdminStats();

  assert.ok(stats, 'Stats object should exist');
  assert.ok(stats.summary, 'Summary should exist');
  assert.equal(typeof stats.uptimeFormatted, 'string');
  assert.ok(stats.uptimeFormatted.length > 0);

  // Content verification - 100% real data
  assert.equal(stats.summary.totalModules, 6, 'Should have exactly 6 pedagogical modules');
  assert.ok(stats.summary.totalChapters >= 80, 'Should have at least 80 chapters');
  assert.ok(stats.summary.totalFlashcards >= 600, 'Should have at least 600 flashcards');
  assert.ok(stats.summary.totalQuizQuestions >= 600, 'Should have at least 600 quiz questions');
  assert.ok(stats.summary.totalExams >= 100, 'Should have at least 100 exams');
  assert.ok(stats.summary.totalExamPoints >= 2000, 'Should have at least 2000 exam points');
  assert.ok(stats.summary.totalEstimatedWords > 100000, 'Should estimate over 100k words');

  // Module integrity
  assert.equal(stats.modules.length, 6);
  stats.modules.forEach((mod) => {
    assert.equal(mod.integrity.valid, true, `Module ${mod.id} must be 100% valid`);
    assert.equal(mod.integrity.issues.length, 0);
    assert.ok(mod.iconName, 'Module should have a papicon iconName');
  });

  // Frontend features recap
  assert.ok(Array.isArray(stats.frontendFeatures));
  assert.equal(stats.frontendFeatures.length, 10);
  stats.frontendFeatures.forEach((feat) => {
    assert.ok(feat.id);
    assert.ok(feat.name);
    assert.ok(feat.iconName, 'Feature should have a papicon iconName');
    assert.equal(feat.status, 'operational');
  });

  // Verify zero emojis in JSON stats
  const jsonStr = JSON.stringify(stats);
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.equal(emojiRegex.test(jsonStr), false, 'JSON stats must not contain any emoji');

  // User stats & system info
  assert.equal(typeof stats.users.totalUsers, 'number');
  assert.ok(Array.isArray(stats.allUsers), 'allUsers should be an array');
  assert.ok(stats.allUsers.length >= 1, 'Should have at least 1 user');
  const sampleUser = stats.allUsers[0];
  assert.ok(sampleUser.id);
  assert.ok(sampleUser.email);
  assert.ok(sampleUser.username);
  assert.equal(typeof sampleUser.xp, 'number');
  assert.equal(typeof sampleUser.streak, 'number');
  assert.ok(stats.system.nodeVersion);
  assert.ok(stats.system.processMemory.heapUsed);
  assert.ok(stats.persistence.type);
});

test('adminService.renderAdminHtml generates valid HTML with exclusively violet theme and papicons', async () => {
  const stats = await adminService.getAdminStats();
  const html = adminService.renderAdminHtml(stats);

  assert.equal(typeof html, 'string');
  assert.ok(html.includes('<!doctype html>'));
  assert.ok(html.includes('Akademia'));
  assert.ok(html.includes('data-theme="violet"'));
  assert.ok(html.includes('--brand: #7C3AED'));
  assert.ok(html.includes('class="papicon'));
  assert.ok(html.includes('modulesTable'));
  assert.ok(html.includes('usersTable'));
  assert.ok(html.includes('userFilter'));
  assert.ok(html.includes('kpi-grid'));
  assert.ok(!html.includes('undefined'), 'HTML should not leak undefined values');

  // Verify zero emojis anywhere in rendered HTML
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.equal(emojiRegex.test(html), false, 'HTML must not contain any emoji');
});

test('HTTP GET /api/admin/stats returns 200 and JSON stats', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/stats`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.summary.totalModules, 6);
    assert.equal(typeof data.summary.totalChapters, 'number');
  } finally {
    server.close();
  }
});

test('HTTP GET /admin returns 200 and HTML page with violet theme and papicons', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/admin`);
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('text/html'));
    const text = await res.text();
    assert.ok(text.includes('<!doctype html>'));
    assert.ok(text.includes('data-theme="violet"'));
    assert.ok(text.includes('papicon'));
  } finally {
    server.close();
  }
});
