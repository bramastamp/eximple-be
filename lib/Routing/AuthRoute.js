const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limiter: 30 detik window
const thirtySeconds = 30 * 1000; // 30 detik dalam milliseconds

/**
 * @route   POST /api/auth/request-otp
 * @desc    Request OTP code for registration/verification
 * @access  Public
 */
router.post('/request-otp', rateLimiter(5, thirtySeconds), AuthController.requestOtp);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', rateLimiter(5, thirtySeconds), validateRegister, AuthController.register);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
router.post('/verify-email', rateLimiter(5, thirtySeconds), AuthController.verifyEmail);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', rateLimiter(5, thirtySeconds), validateLogin, AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;

