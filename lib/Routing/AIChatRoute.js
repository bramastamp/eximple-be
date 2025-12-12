const express = require('express');
const router = express.Router();
const AIChatController = require('../controllers/AIChat/AIChatController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/sessions', AIChatController.createSession);
router.get('/sessions', AIChatController.getSessions);
router.get('/sessions/:sessionId/messages', AIChatController.getMessages);
router.post('/sessions/:sessionId/messages', AIChatController.sendMessage);
router.get('/test-api-key', AIChatController.testApiKey);

module.exports = router;

