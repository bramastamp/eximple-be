const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

/**
 * @route   POST /api/auth/request-otp
 * @desc    Request OTP code for registration/verification
 * @access  Public
 */
router.post('/request-otp', AuthController.requestOtp);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validateRegister, AuthController.register);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
router.post('/verify-email', AuthController.verifyEmail);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;

