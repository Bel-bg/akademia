const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const contentService = require('./services/contentService');
const progressService = require('./services/progressService');
const progressionService = require('./services/progressionService');
const pushService = require('./services/pushService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'akademia-backend',
    persistenceConfigured: progressService.isConfigured(),
    pushConfigured: pushService.isConfigured(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/theme', (req, res) => {
  const filiere = progressionService.normalizeFiliere(req.query.filiere);
  const theme = progressionService.themeForFiliere(filiere);
  res.json({
    filiere,
    theme,
    defaultTheme: progressionService.DEFAULT_THEME,
    filieres: Object.values(progressionService.FILIERES),
  });
});

// ==================== AUTHENTIFICATION EMAIL / MOT DE PASSE ====================
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const result = await progressService.signUpUser({
      email: req.body?.email,
      password: req.body?.password,
      username: req.body?.username,
      filiere: req.body?.filiere,
    });
    res.status(201).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

app.post('/api/auth/signin', async (req, res, next) => {
  try {
    const result = await progressService.signInUser({
      email: req.body?.email,
      password: req.body?.password,
    });
    res.json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

app.post('/api/auth/signout', async (req, res, next) => {
  try {
    const match = req.headers.authorization?.match(/^Bearer\s+(.+)$/i);
    if (match) await progressService.signOutUser(match[1]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    await progressService.resetUserPassword({
      email: req.body?.email,
      newPassword: req.body?.newPassword,
    });
    res.json({ ok: true });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

async function requireUser(req, res, next) {
  const match = req.headers.authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Authentification requise' });
  try {
    const user = await progressService.verifyAccessToken(match[1]);
    if (!user) return res.status(401).json({ error: 'Session invalide ou expirée' });
    req.auth = { user, accessToken: match[1] };
    return next();
  } catch (error) {
    return next(error);
  }
}

// ==================== CONTENU DES MODULES ====================
app.get('/api/modules', (_req, res) => {
  res.json(contentService.getModules());
});

app.get('/api/modules/:moduleId', (req, res) => {
  const module = contentService.getModule(req.params.moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module introuvable' });
  }
  return res.json(module);
});

app.get('/api/modules/:moduleId/chapters/:chapterFile', (req, res) => {
  const content = contentService.getChapter(req.params.moduleId, req.params.chapterFile);
  if (content === null) {
    return res.status(404).json({ error: 'Chapitre introuvable' });
  }
  return res.type('text/markdown').send(content);
});

app.get('/api/modules/:moduleId/quiz', (req, res) => {
  res.json(contentService.getQuiz(req.params.moduleId));
});

app.get('/api/modules/:moduleId/cards', (req, res) => {
  res.json(contentService.getCards(req.params.moduleId));
});

app.get('/api/modules/:moduleId/exams-index', (req, res) => {
  res.json(contentService.getExamIndex(req.params.moduleId));
});

app.get('/api/modules/:moduleId/exams/:examNumber', (req, res) => {
  const exam = contentService.getExam(req.params.moduleId, req.params.examNumber);
  if (!exam) {
    return res.status(404).json({ error: 'Épreuve introuvable' });
  }
  return res.json(exam);
});

// ==================== PROFIL, CLASSEMENT, ACTUALITÉS & PROGRESSION ====================
app.get('/api/me', requireUser, async (req, res, next) => {
  try {
    const profile = await progressService.getProfile(req.auth.accessToken, req.auth.user.id);
    const state = await progressService.loadProgress(req.auth.accessToken, req.auth.user.id);
    const filiere = progressionService.normalizeFiliere(state?.filiere ?? profile?.filiere);
    const theme = progressionService.themeForFiliere(filiere);
    res.json({
      id: req.auth.user.id,
      email: profile?.email || req.auth.user.email,
      username: profile?.username || req.auth.user.username || 'Étudiant',
      filiere,
      theme,
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/me', requireUser, async (req, res, next) => {
  try {
    const updated = await progressService.updateProfile(req.auth.accessToken, req.auth.user.id, {
      username: req.body?.username,
      filiere: req.body?.filiere,
    });
    res.json(updated);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

app.get('/api/leaderboard', requireUser, async (req, res, next) => {
  try {
    res.json(await progressService.getLeaderboard(req.auth.accessToken, req.query.limit));
  } catch (error) {
    next(error);
  }
});

app.get('/api/battle', async (_req, res, next) => {
  try {
    res.json(progressService.getBattleData());
  } catch (error) {
    next(error);
  }
});

app.get('/api/push/config', (_req, res) => {
  res.json({ enabled: pushService.isConfigured(), publicKey: pushService.isConfigured() ? pushService.vapidPublicKey : null });
});

app.post('/api/push/subscriptions', requireUser, async (req, res, next) => {
  try {
    await pushService.saveSubscription(req.auth.user.id, req.body?.subscription);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/push/subscriptions', requireUser, async (req, res, next) => {
  try {
    await pushService.removeSubscription(req.auth.user.id, req.body?.endpoint);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/messages', requireUser, async (req, res, next) => {
  const recipientId = req.body?.recipientId;
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recipientId || '')
    || recipientId === req.auth.user.id || !body || body.length > 2000) {
    return res.status(400).json({ error: 'Destinataire ou message invalide.' });
  }
  try {
    const message = await progressService.insertMessage(req.auth.accessToken, req.auth.user.id, recipientId, body);
    if (!message) return res.status(502).json({ error: 'Le message n’a pas pu être enregistré.' });
    res.status(201).json(message);
    void (async () => {
      try {
        const sender = await progressService.getProfile(req.auth.accessToken, req.auth.user.id);
        await pushService.notifyMessage(recipientId, req.auth.user.id, sender?.username || 'Un joueur', message.body);
      } catch (error) {
        console.error('Push message failed:', error.message || error);
      }
    })();
  } catch (error) {
    next(error);
  }
});

app.delete('/api/messages/conversations/:partnerId', requireUser, async (req, res, next) => {
  const { partnerId } = req.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(partnerId)
    || partnerId === req.auth.user.id) {
    return res.status(400).json({ error: 'Discussion invalide.' });
  }
  try {
    const deleted = await progressService.deleteConversationForParticipants(req.auth.accessToken, req.auth.user.id, partnerId);
    res.json({ ok: true, deleted });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/messages/:messageId', requireUser, async (req, res, next) => {
  const { messageId } = req.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(messageId)) {
    return res.status(400).json({ error: 'Message invalide.' });
  }
  try {
    const deleted = await progressService.deleteMessageForParticipants(req.auth.accessToken, req.auth.user.id, messageId);
    if (!deleted) return res.status(404).json({ error: 'Message introuvable ou accès refusé.' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/feed', requireUser, async (req, res, next) => {
  try {
    res.json(await progressService.getFeed(req.auth.user.id));
  } catch (error) {
    next(error);
  }
});

app.post('/api/feed/:postId/like', requireUser, async (req, res, next) => {
  try {
    res.json(await progressService.togglePostLike(req.auth.user.id, req.params.postId));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

app.post('/api/feed/:postId/comments', requireUser, async (req, res, next) => {
  try {
    res.status(201).json(await progressService.addPostComment(req.auth.user.id, req.params.postId, req.body?.text));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

app.post('/api/battle/vote', requireUser, async (req, res, next) => {
  try {
    res.json(await progressService.voteBattle(req.auth.user.id, req.body?.camp));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});
  }
});

app.get('/api/progress', requireUser, async (req, res, next) => {
  try {
    const loaded = await progressService.loadProgress(req.auth.accessToken, req.auth.user.id);
    const baseState = loaded || progressionService.defaultState();
    const filiere = progressionService.normalizeFiliere(baseState.filiere);
    const state = {
      ...baseState,
      filiere,
      theme: progressionService.themeForFiliere(filiere),
    };
    res.json({ state, filiere: state.filiere, theme: state.theme });
  } catch (error) {
    next(error);
  }
});

app.post('/api/progress/actions', requireUser, async (req, res, next) => {
  try {
    const actionId = req.body?.actionId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actionId || '')) {
      return res.status(400).json({ error: 'Identifiant d’action invalide.' });
    }
    const previousResult = await progressService.getActionReceipt(req.auth.accessToken, req.auth.user.id, actionId);
    if (previousResult) return res.json(previousResult);
    let leaderboardBefore = null;
    if (pushService.isConfigured()) {
      try { leaderboardBefore = await progressService.getLeaderboard(req.auth.accessToken, 1000); } catch { /* les notifications ne bloquent pas la progression */ }
    }
    const current = await progressService.loadProgress(req.auth.accessToken, req.auth.user.id);
    const action = req.body?.action || req.body;
    const result = progressionService.applyAction(current || progressionService.defaultState(), action, contentService);
    const savedState = await progressService.saveProgress(req.auth.accessToken, req.auth.user.id, result.state);
    const finalResult = {
      ...result,
      state: savedState,
      filiere: savedState.filiere,
      theme: savedState.theme,
    };
    await progressService.saveActionReceipt(req.auth.accessToken, req.auth.user.id, actionId, finalResult);
    res.json(finalResult);
    if (leaderboardBefore) {
      void (async () => {
        try {
          const leaderboardAfter = await progressService.getLeaderboard(req.auth.accessToken, 1000);
          const overtaken = progressService.overtakenPlayerIds(leaderboardBefore, leaderboardAfter, req.auth.user.id);
          if (overtaken.length) {
            const profile = await progressService.getProfile(req.auth.accessToken, req.auth.user.id);
            await pushService.notifyOvertaken(overtaken, profile?.username || 'Un joueur');
          }
        } catch (error) {
          console.error('Push ranking failed:', error.message || error);
        }
      })();
    }
  } catch (error) {
    if (error.status) return next(error);
    return res.status(400).json({ error: error.message || 'Action invalide' });
  }
});

app.post('/api/progress/import', requireUser, async (req, res, next) => {
  try {
    const current = await progressService.loadProgress(req.auth.accessToken, req.auth.user.id);
    if (current) return res.status(409).json({ error: 'Une progression existe déjà.' });
    const state = progressionService.importLegacyState(req.body?.state, contentService);
    await progressService.saveProgress(req.auth.accessToken, req.auth.user.id, state);
    return res.json({ state });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/progress', requireUser, async (req, res, next) => {
  try {
    const current = await progressService.loadProgress(req.auth.accessToken, req.auth.user.id);
    const filiere = progressionService.normalizeFiliere(current?.filiere);
    const state = {
      ...progressionService.defaultState(),
      filiere,
      theme: progressionService.themeForFiliere(filiere),
    };
    await progressService.saveProgress(req.auth.accessToken, req.auth.user.id, state);
    res.json({ ok: true, state });
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err.message || err);
  res.status(err.status || 500).json({ error: err.status === 503 ? err.message : 'Erreur serveur interne' });
});

app.listen(PORT, () => {
  console.log(`Akademia backend listening on http://localhost:${PORT}`);
});
