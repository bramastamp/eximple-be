const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const { authenticate } = require('../middleware/auth');
const { validateCompleteProfile } = require('../middleware/validation');

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', authenticate, ProfileController.getProfile);

/**
 * @route   PUT /api/profile/complete
 * @desc    Complete profile (onboarding)
 * @access  Private
 */
router.put('/complete', authenticate, validateCompleteProfile, ProfileController.completeProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update profile
 * @access  Private
 */
router.put('/', authenticate, validateCompleteProfile, ProfileController.updateProfile);

module.exports = router;

