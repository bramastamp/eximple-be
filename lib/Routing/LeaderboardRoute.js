const express = require('express');
const router = express.Router();
const LeaderboardController = require('../controllers/Leaderboard/LeaderboardController');
const { authenticate } = require('../middleware/auth');

// All leaderboard routes require authentication
router.use(authenticate);

router.get('/', LeaderboardController.getLeaderboard);
router.get('/my-rank', LeaderboardController.getMyRank);

module.exports = router;

