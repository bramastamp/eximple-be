const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const { authenticate } = require('../middleware/auth');
const { validateCompleteProfile } = require('../middleware/validation');

router.get('/', authenticate, ProfileController.getProfile);
router.put('/complete', authenticate, validateCompleteProfile, ProfileController.completeProfile);
router.put('/', authenticate, validateCompleteProfile, ProfileController.updateProfile);

module.exports = router;
