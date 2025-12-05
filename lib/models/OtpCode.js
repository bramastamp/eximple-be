const supabase = require('../config/db');
const crypto = require('crypto');

class OtpCode {
  /**
   * Generate OTP code (6 digits)
   */
  static generateCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create OTP code
   */
  static async create(otpData) {
    const { user_id, email, phone, purpose, expiresInMinutes = 10 } = otpData;
    
    const code = this.generateCode();
    const expires_at = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const { data, error } = await supabase
      .from('otp_codes')
      .insert([
        {
          user_id,
          email,
          phone,
          code,
          purpose,
          expires_at,
          is_used: false,
          attempts: 0,
          max_attempts: 3
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { ...data, code }; // Return code only for creation, don't store plain text
  }

  /**
   * Verify OTP code
   */
  static async verify(email, code, purpose) {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Increment attempts if OTP exists but wrong
      if (data?.id) {
        await this.incrementAttempts(data.id);
      }
      return { valid: false, message: 'Invalid or expired OTP code' };
    }

    // Check max attempts
    if (data.attempts >= data.max_attempts) {
      return { valid: false, message: 'OTP code has reached maximum attempts' };
    }

    // Mark as used
    await this.markAsUsed(data.id);

    return { valid: true, data };
  }

  /**
   * Increment attempts
   */
  static async incrementAttempts(otpId) {
    const { data: otp } = await supabase
      .from('otp_codes')
      .select('attempts, max_attempts')
      .eq('id', otpId)
      .single();

    if (!otp) return;

    const newAttempts = otp.attempts + 1;
    const is_used = newAttempts >= otp.max_attempts;

    await supabase
      .from('otp_codes')
      .update({ attempts: newAttempts, is_used })
      .eq('id', otpId);
  }

  /**
   * Mark OTP as used
   */
  static async markAsUsed(otpId) {
    await supabase
      .from('otp_codes')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', otpId);
  }

  /**
   * Check rate limit
   */
  static async checkRateLimit(identifier, purpose, maxRequests = 3, windowMinutes = 15) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const { data, error } = await supabase
      .from('otp_rate_limits')
      .select('request_count')
      .eq('identifier', identifier)
      .eq('purpose', purpose)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data && data.request_count >= maxRequests) {
      return { allowed: false, message: 'Too many requests. Please try again later.' };
    }

    // Update or create rate limit record
    if (data) {
      await supabase
        .from('otp_rate_limits')
        .update({ request_count: data.request_count + 1 })
        .eq('id', data.id);
    } else {
      await supabase
        .from('otp_rate_limits')
        .insert([{
          identifier,
          purpose,
          request_count: 1,
          window_start: new Date().toISOString()
        }]);
    }

    return { allowed: true };
  }
}

module.exports = OtpCode;

