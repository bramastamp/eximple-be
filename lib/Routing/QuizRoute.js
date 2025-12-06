const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/Quiz/QuizController');
const { authenticate } = require('../middleware/auth');

// All quiz routes require authentication
router.use(authenticate);

// Quiz routes
router.get('/levels/:levelId/questions', QuizController.getQuestions);
router.post('/levels/:levelId/submit', QuizController.submitQuiz);

module.exports = router;

