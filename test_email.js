require('dotenv').config();
const { sendOtpEmail } = require('./lib/utils/emailService');

async function testEmail() {
  console.log('=== Testing Email Service ===\n');
  
  console.log('Environment Variables:');
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET');
  console.log('');

  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  const testOtp = '123456';

  console.log(`Sending test email to: ${testEmail}`);
  console.log(`OTP Code: ${testOtp}\n`);

  const result = await sendOtpEmail(testEmail, testOtp, 'email_verification');

  if (result.success) {
    console.log('\n✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
  } else {
    console.log('\n❌ Failed to send email');
    console.log('Error:', result.error);
    if (result.details) {
      console.log('Details:', result.details);
    }
  }
}

testEmail().catch(console.error);

