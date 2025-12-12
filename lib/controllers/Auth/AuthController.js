const User = require('../../models/User');
const UserProfile = require('../../models/UserProfile');
const UserPoints = require('../../models/UserPoints');
const UserStreaks = require('../../models/UserStreaks');
const OtpCode = require('../../models/OtpCode');
const { sendOtpEmail } = require('../../utils/emailService');
const jwt = require('jsonwebtoken');

class AuthController {
  static async register(req, res) {
    try {
      const { username, email, password, confirm_password } = req.body;

      if (await User.usernameExists(username)) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'username', message: 'Username already exists', code: 'USERNAME_EXISTS' }]
        });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.is_active) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'email', message: 'Email already registered', code: 'EMAIL_EXISTS' }]
        });
      }

      if (existingUser && !existingUser.is_active) {
        await User.update(existingUser.id, { username, password_hash: await User.hashPassword(password) });
        const user = existingUser;
        
        await OtpCode.invalidateOldOtps(email, 'email_verification');
        const otp = await OtpCode.create({
          email,
          purpose: 'email_verification',
          expiresInMinutes: 120
        });

        const emailResult = await sendOtpEmail(email, otp.code, 'email_verification');

        res.status(200).json({
          success: true,
          message: emailResult.success 
            ? 'Registration successful. OTP code has been sent to your email.'
            : 'Registration successful, but failed to send email. Please request OTP manually.',
          data: {
            user_id: user.id,
            username: user.username,
            email: user.email,
            email_verified: false,
            profile_complete: false,
            ...(process.env.NODE_ENV === 'development' && { otp_code: otp.code })
          }
        });
        return;
      }

      const password_hash = await User.hashPassword(password);

      const user = await User.create({
        username,
        email,
        password_hash,
        role: 'student'
      });

      await UserProfile.create(user.id);
      await UserPoints.initialize(user.id);
      await UserStreaks.initialize(user.id);

      await OtpCode.invalidateOldOtps(email, 'email_verification');
      const otp = await OtpCode.create({
        email,
        purpose: 'email_verification',
        expiresInMinutes: 120
      });

      const emailResult = await sendOtpEmail(email, otp.code, 'email_verification');

      const { password_hash: _, ...userResponse } = user;

      res.status(201).json({
        success: true,
        message: emailResult.success 
          ? 'Registration successful. OTP code has been sent to your email.'
          : 'Registration successful, but failed to send email. Please request OTP manually.',
        data: {
          user_id: user.id,
          username: user.username,
          email: user.email,
          email_verified: false,
          profile_complete: false,
          ...(process.env.NODE_ENV === 'development' && { otp_code: otp.code })
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Registration failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  static async requestOtp(req, res) {
    try {
      const { email, purpose = 'email_verification' } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'email', message: 'Email is required', code: 'EMAIL_REQUIRED' }]
        });
      }

      const rateLimit = await OtpCode.checkRateLimit(email, purpose, 5, 0.5);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          message: rateLimit.message
        });
      }

      if (purpose === 'email_verification') {
        const existingUser = await User.findByEmail(email);
        if (!existingUser) {
          return res.status(404).json({
            success: false,
            errors: [{ field: 'email', message: 'Email not registered. Please register first.', code: 'EMAIL_NOT_FOUND' }]
          });
        }

        if (existingUser.is_active) {
          return res.status(400).json({
            success: false,
            errors: [{ field: 'email', message: 'Email already verified', code: 'EMAIL_ALREADY_VERIFIED' }]
          });
        }
      }

      await OtpCode.invalidateOldOtps(email, purpose);

      const otp = await OtpCode.create({
        email,
        purpose,
        expiresInMinutes: 120
      });

      const emailResult = await sendOtpEmail(email, otp.code, purpose);
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send email. Please check email configuration.',
          ...(process.env.NODE_ENV === 'development' && { 
            error: emailResult.error,
            otp_code: otp.code
          })
        });
      }

      res.status(200).json({
        success: true,
        message: 'OTP code sent to email',
        ...(process.env.NODE_ENV === 'development' && { otp_code: otp.code })
      });
    } catch (error) {

      
      let statusCode = 500;
      let errorMessage = 'Failed to send OTP';
      
      if (error.message && error.message.includes('Invalid API key')) {
        statusCode = 500;
        errorMessage = 'Database configuration error. Please check SUPABASE_ANON_KEY in .env file';
      } else if (error.message && error.message.includes('JWT')) {
        statusCode = 500;
        errorMessage = 'Database authentication error. Please check Supabase credentials';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          stack: error.stack 
        })
      });
    }
  }

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

      const otpCodeString = String(otp_code).trim();
      const otpVerification = await OtpCode.verify(email, otpCodeString, 'email_verification');
      if (!otpVerification.valid) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'otp_code', message: otpVerification.message, code: 'INVALID_OTP' }]
        });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please register first.'
        });
      }

      if (user.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Email already verified'
        });
      }

      await User.activate(user.id);

      const profile = await UserProfile.findByUserId(user.id);
      const profileComplete = await UserProfile.isComplete(user.id);

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

      const { password_hash: _, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. Please complete your profile.',
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

      res.status(500).json({
        success: false,
        message: 'Email verification failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Please verify your email first'
        });
      }

      const isPasswordValid = await User.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const profile = await UserProfile.findByUserId(user.id);
      const profileComplete = await UserProfile.isComplete(user.id);
      const userPoints = await UserPoints.getByUserId(user.id);

      if (profile) {
        await UserProfile.update(user.id, { last_login: new Date().toISOString() });
      }

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

      const { password_hash: _, ...userResponse } = user;

      const pointsData = userPoints ? {
        total: userPoints.total_points || 0,
        weekly: userPoints.weekly_points || 0,
        monthly: userPoints.monthly_points || 0
      } : {
        total: 0,
        weekly: 0,
        monthly: 0
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            ...userResponse,
            profile_complete: profileComplete,
            profile: profile || null,
            points: pointsData,
            // Alias untuk kompatibilitas
            total_points: pointsData.total,
            weekly_points: pointsData.weekly,
            monthly_points: pointsData.monthly
          }
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Login failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

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
      const userPoints = await UserPoints.getByUserId(userId);

      const { password_hash: _, ...userResponse } = user;

      const pointsData = userPoints ? {
        total: userPoints.total_points || 0,
        weekly: userPoints.weekly_points || 0,
        monthly: userPoints.monthly_points || 0
      } : {
        total: 0,
        weekly: 0,
        monthly: 0
      };

      res.status(200).json({
        success: true,
        data: {
          ...userResponse,
          profile_complete: profileComplete,
          points: pointsData,
          // Alias untuk kompatibilitas
          total_points: pointsData.total,
          weekly_points: pointsData.weekly,
          monthly_points: pointsData.monthly
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to get user data',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
}

module.exports = AuthController;
