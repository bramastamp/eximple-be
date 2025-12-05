/**
 * Validation middleware for register
 */
const validateRegister = (req, res, next) => {
  const { username, email, password, confirm_password, otp_code } = req.body;
  const errors = [];

  // Username validation
  if (!username) {
    errors.push({ field: 'username', message: 'Username is required', code: 'USERNAME_REQUIRED' });
  } else {
    if (username.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters', code: 'USERNAME_TOO_SHORT' });
    }
    if (username.length > 100) {
      errors.push({ field: 'username', message: 'Username must not exceed 100 characters', code: 'USERNAME_TOO_LONG' });
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, underscore, and dash. Must start with a letter.', code: 'INVALID_USERNAME_FORMAT' });
    }
  }

  // Email validation
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'EMAIL_REQUIRED' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' });
    }
    if (email.length > 255) {
      errors.push({ field: 'email', message: 'Email must not exceed 255 characters', code: 'EMAIL_TOO_LONG' });
    }
  }

  // Password validation
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required', code: 'PASSWORD_REQUIRED' });
  } else {
    if (password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters', code: 'PASSWORD_TOO_SHORT' });
    }
    if (password.length > 128) {
      errors.push({ field: 'password', message: 'Password must not exceed 128 characters', code: 'PASSWORD_TOO_LONG' });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      errors.push({ 
        field: 'password', 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character', 
        code: 'WEAK_PASSWORD' 
      });
    }
    if (password === username || password === email) {
      errors.push({ field: 'password', message: 'Password cannot be the same as username or email', code: 'PASSWORD_SAME_AS_CREDENTIALS' });
    }
  }

  // Confirm password validation
  if (!confirm_password) {
    errors.push({ field: 'confirm_password', message: 'Confirm password is required', code: 'CONFIRM_PASSWORD_REQUIRED' });
  } else if (password !== confirm_password) {
    errors.push({ field: 'confirm_password', message: 'Passwords do not match', code: 'PASSWORDS_NOT_MATCH' });
  }

  // OTP validation
  if (!otp_code) {
    errors.push({ field: 'otp_code', message: 'OTP code is required', code: 'OTP_REQUIRED' });
  } else {
    if (!/^\d{6}$/.test(otp_code)) {
      errors.push({ field: 'otp_code', message: 'OTP code must be 6 digits', code: 'INVALID_OTP_FORMAT' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

/**
 * Validation middleware for login
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'EMAIL_REQUIRED' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required', code: 'PASSWORD_REQUIRED' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

/**
 * Validation middleware for complete profile
 */
const validateCompleteProfile = (req, res, next) => {
  const { full_name, gender, grade_level_id, class_id, bio } = req.body;
  const errors = [];

  // Full name validation
  if (full_name) {
    if (full_name.length < 2) {
      errors.push({ field: 'full_name', message: 'Full name must be at least 2 characters', code: 'FULL_NAME_TOO_SHORT' });
    }
    if (full_name.length > 255) {
      errors.push({ field: 'full_name', message: 'Full name must not exceed 255 characters', code: 'FULL_NAME_TOO_LONG' });
    }
  }

  // Gender validation
  if (gender && !['male', 'female', 'other'].includes(gender)) {
    errors.push({ field: 'gender', message: 'Gender must be one of: male, female, other', code: 'INVALID_GENDER' });
  }

  // Grade level validation
  if (grade_level_id && isNaN(parseInt(grade_level_id))) {
    errors.push({ field: 'grade_level_id', message: 'Grade level ID must be a number', code: 'INVALID_GRADE_LEVEL_ID' });
  }

  // Class ID validation
  if (class_id && isNaN(parseInt(class_id))) {
    errors.push({ field: 'class_id', message: 'Class ID must be a number', code: 'INVALID_CLASS_ID' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCompleteProfile
};

