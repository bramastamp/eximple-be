const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Debug: Check if .env is loaded
  console.log('🔍 Debug Info:');
  console.log('   Current directory:', __dirname);
  console.log('   .env file path:', path.resolve(__dirname, '.env'));
  console.log('');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('');

  let transporter = null;

  // Check configuration type
  if (process.env.EMAIL_SERVICE === 'gmail') {
    // Gmail configuration
    if (!process.env.EMAIL_USER) {
      console.error('❌ EMAIL_USER is required when using EMAIL_SERVICE=gmail');
      return;
    }
    
    const gmailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
    if (!gmailPass) {
      console.error('❌ EMAIL_PASSWORD or EMAIL_PASS is required when using EMAIL_SERVICE=gmail');
      console.error('   For Gmail, use App Password (not regular password)');
      console.error('   Get it from: https://support.google.com/accounts/answer/185833');
      return;
    }

    console.log('🔌 Creating Gmail transporter...');
    console.log(`   Service: gmail`);
    console.log(`   User: ${process.env.EMAIL_USER}`);
    console.log('');

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: gmailPass
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });
  } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // SMTP configuration
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const secure = port === 465;

    console.log('🔌 Creating SMTP transporter...');
    console.log(`   Host: ${process.env.EMAIL_HOST}`);
    console.log(`   Port: ${port} (secure: ${secure})`);
    console.log(`   User: ${process.env.EMAIL_USER}`);
    console.log('');

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: port,
      secure: secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });
  } else {
    console.error('❌ Email configuration incomplete!');
    console.error('');
    console.error('   Option 1: Gmail (EMAIL_SERVICE=gmail)');
    console.error('     EMAIL_SERVICE=gmail');
    console.error('     EMAIL_USER=your-email@gmail.com');
    console.error('     EMAIL_PASSWORD=your-app-password');
    console.error('');
    console.error('   Option 2: SMTP Custom');
    console.error('     EMAIL_HOST=smtp.gmail.com');
    console.error('     EMAIL_PORT=587');
    console.error('     EMAIL_USER=your-email@gmail.com');
    console.error('     EMAIL_PASS=your-app-password');
    return;
  }

  // Test 1: Verify Connection
  console.log('📡 Test 1: Verifying connection...');
  try {
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000))
    ]);
    console.log('✅ Connection verified!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('   Error Code:', error.code);
    if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Port mungkin di-block oleh VPS provider!');
      console.error('   💡 Solusi: Coba port 587 atau 465, atau gunakan SendGrid/Mailgun');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   ⚠️  Connection timeout - port mungkin di-block atau SMTP server tidak accessible');
    } else if (error.code === 'EAUTH') {
      console.error('   ⚠️  Authentication failed - check EMAIL_USER dan EMAIL_PASS');
    }
    return;
  }

  // Test 2: Send Test Email
  console.log('\n📧 Test 2: Sending test email...');
  try {
    const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER;
    console.log(`   To: ${testEmail}`);
    
    const info = await Promise.race([
      transporter.sendMail({
        from: `"Test" <${process.env.EMAIL_USER}>`,
        to: testEmail,
        subject: 'Test Email dari Production',
        text: 'Ini adalah test email dari production server.',
        html: '<p>Ini adalah <b>test email</b> dari production server.</p>'
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Send timeout after 15 seconds')), 15000))
    ]);
    
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log(`\n✅ Check inbox: ${testEmail}`);
  } catch (error) {
    console.error('❌ Send failed:', error.message);
    console.error('   Error Code:', error.code);
    console.error('   Response Code:', error.responseCode);
    console.error('   Response:', error.response);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('\n💡 Kemungkinan port di-block. Solusi:');
      console.error('   1. Coba port 587 atau 465');
      console.error('   2. Request port unblock dari VPS provider');
      console.error('   3. Gunakan SMTP relay service (SendGrid, Mailgun)');
    } else if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   1. EMAIL_USER dan EMAIL_PASS benar');
      console.error('   2. Untuk Gmail, gunakan App Password (bukan password biasa)');
    }
  }
}

testEmail().catch(console.error);

