const express = require('express');
const router = express.Router();
const AchievementController = require('../controllers/Achievement/AchievementController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', AchievementController.getAllAchievements);
router.get('/my-achievements', AchievementController.getMyAchievements);

module.exports = router;

