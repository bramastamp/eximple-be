const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/Auth/AuthController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const rateLimiter = require('../middleware/rateLimiter');

const thirtySeconds = 30 * 1000;

router.post('/request-otp', rateLimiter(5, thirtySeconds), AuthController.requestOtp);
router.post('/register', rateLimiter(5, thirtySeconds), validateRegister, AuthController.register);
router.post('/verify-email', rateLimiter(5, thirtySeconds), AuthController.verifyEmail);
router.post('/login', rateLimiter(5, thirtySeconds), validateLogin, AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;
