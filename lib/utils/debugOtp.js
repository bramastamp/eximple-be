const supabase = require('../config/db');

async function debugOtp(email, code) {
  console.log('\n=== OTP Debug ===');
  console.log('Email:', email);
  console.log('Code:', code);
  console.log('Code type:', typeof code);
  
  const { data: allOtps, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', email)
    .eq('purpose', 'email_verification')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nAll OTPs for this email:');
  allOtps.forEach((otp, idx) => {
    const isExpired = new Date(otp.expires_at) <= new Date();
    const isUsed = otp.is_used;
    const codeMatch = String(otp.code) === String(code);
    
    console.log(`\nOTP ${idx + 1}:`);
    console.log('  Code:', otp.code, '(match:', codeMatch, ')');
    console.log('  Is Used:', isUsed);
    console.log('  Is Expired:', isExpired);
    console.log('  Expires At:', otp.expires_at);
    console.log('  Created At:', otp.created_at);
    console.log('  Attempts:', otp.attempts, '/', otp.max_attempts);
  });

  const matchingOtp = allOtps.find(otp => String(otp.code) === String(code));
  if (matchingOtp) {
    console.log('\n=== Matching OTP Found ===');
    console.log('Is Used:', matchingOtp.is_used);
    console.log('Is Expired:', new Date(matchingOtp.expires_at) <= new Date());
    console.log('Expires At:', matchingOtp.expires_at);
    console.log('Current Time:', new Date().toISOString());
  } else {
    console.log('\n=== No Matching OTP Found ===');
  }
}

module.exports = debugOtp;

