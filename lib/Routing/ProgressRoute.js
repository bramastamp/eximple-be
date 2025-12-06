const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/Progress/ProgressController');
const { authenticate } = require('../middleware/auth');

// All progress routes require authentication
router.use(authenticate);

// Progress routes
router.post('/levels/:levelId/start', ProgressController.startLevel);
router.get('/levels/:levelId', ProgressController.getLevelProgress);
router.put('/levels/:levelId', ProgressController.updateProgress);
router.post('/levels/:levelId/complete', ProgressController.completeLevel);

// User progress routes
router.get('/my-progress', ProgressController.getMyProgress);
router.get('/stats', ProgressController.getProgressStats);

// Journey map routes
router.get('/journey-map/:subjectLevelId', ProgressController.getJourneyMap);

module.exports = router;

