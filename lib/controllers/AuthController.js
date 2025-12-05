const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const UserPoints = require('../models/UserPoints');
const UserStreaks = require('../models/UserStreaks');
const OtpCode = require('../models/OtpCode');
const jwt = require('jsonwebtoken');

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const { username, email, password, confirm_password, otp_code } = req.body;

      // Check if username exists
      if (await User.usernameExists(username)) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'username', message: 'Username already exists', code: 'USERNAME_EXISTS' }]
        });
      }

      // Check if email exists
      if (await User.emailExists(email)) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'email', message: 'Email already exists', code: 'EMAIL_EXISTS' }]
        });
      }

      // Verify OTP
      const otpVerification = await OtpCode.verify(email, otp_code, 'email_verification');
      if (!otpVerification.valid) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'otp_code', message: otpVerification.message, code: 'INVALID_OTP' }]
        });
      }

      // Hash password
      const password_hash = await User.hashPassword(password);

      // Create user
      const user = await User.create({
        username,
        email,
        password_hash,
        role: 'student'
      });

      // Create empty profile
      await UserProfile.create(user.id);

      // Initialize points
      await UserPoints.initialize(user.id);

      // Initialize streaks
      await UserStreaks.initialize(user.id);

      // Don't send password_hash in response
      const { password_hash: _, ...userResponse } = user;

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          user_id: user.id,
          username: user.username,
          email: user.email,
          email_verified: false,
          profile_complete: false
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  /**
   * Request OTP for registration
   * POST /api/auth/request-otp
   */
  static async requestOtp(req, res) {
    try {
      const { email, purpose = 'email_verification' } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'email', message: 'Email is required', code: 'EMAIL_REQUIRED' }]
        });
      }

      // Check rate limit
      const rateLimit = await OtpCode.checkRateLimit(email, purpose);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          message: rateLimit.message
        });
      }

      // Check if email already registered (for registration purpose)
      if (purpose === 'email_verification') {
        if (await User.emailExists(email)) {
          return res.status(400).json({
            success: false,
            errors: [{ field: 'email', message: 'Email already registered', code: 'EMAIL_EXISTS' }]
          });
        }
      }

      // Create OTP
      const otp = await OtpCode.create({
        email,
        purpose,
        expiresInMinutes: 10
      });

      // TODO: Send OTP via email service
      // await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otp.code}`);

      // For development, return OTP in response
      // Remove this in production!
      res.status(200).json({
        success: true,
        message: 'OTP code sent to email',
        // Remove this in production:
        ...(process.env.NODE_ENV === 'development' && { otp_code: otp.code })
      });
    } catch (error) {
      console.error('Request OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: error.message
      });
    }
  }

  /**
   * Verify email with OTP
   * POST /api/auth/verify-email
   */
  static async verifyEmail(req, res) {
    try {
      const { email, otp_code } = req.body;

      if (!email || !otp_code) {
        return res.status(400).json({
          success: false,
          errors: [
            { field: 'email', message: 'Email is required', code: 'EMAIL_REQUIRED' },
            { field: 'otp_code', message: 'OTP code is required', code: 'OTP_REQUIRED' }
          ]
        });
      }

      // Verify OTP
      const otpVerification = await OtpCode.verify(email, otp_code, 'email_verification');
      if (!otpVerification.valid) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'otp_code', message: otpVerification.message, code: 'INVALID_OTP' }]
        });
      }

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Activate user
      await User.activate(user.id);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed',
        error: error.message
      });
    }
  }

  /**
   * Login
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Please verify your email first'
        });
      }

      // Verify password
      const isPasswordValid = await User.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Get profile
      const profile = await UserProfile.findByUserId(user.id);
      const profileComplete = await UserProfile.isComplete(user.id);

      // Update last login
      if (profile) {
        await UserProfile.update(user.id, { last_login: new Date().toISOString() });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      // Don't send password_hash
      const { password_hash: _, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            ...userResponse,
            profile_complete: profileComplete,
            profile: profile || null
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  static async getMe(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByIdWithProfile(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const profileComplete = await UserProfile.isComplete(userId);

      const { password_hash: _, ...userResponse } = user;

      res.status(200).json({
        success: true,
        data: {
          ...userResponse,
          profile_complete: profileComplete
        }
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user data',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;

