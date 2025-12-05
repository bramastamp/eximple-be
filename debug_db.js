/**
 * Debug script untuk test koneksi Supabase
 * Jalankan: node debug_db.js
 */

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

console.log('🔍 Debugging Supabase Connection...\n');

// 1. Cek Environment Variables
console.log('1️ Checking Environment Variables:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ NOT SET');
console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ NOT SET');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('');

// 2. Cek Format URL
if (process.env.SUPABASE_URL) {
  const url = process.env.SUPABASE_URL;
  console.log('2️ Checking SUPABASE_URL Format:');
  console.log('   URL:', url);
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.log('    ERROR: URL harus dimulai dengan http:// atau https://');
  } else if (!url.includes('.supabase.co')) {
    console.log('     WARNING: URL tidak mengandung .supabase.co');
  } else {
    console.log('    Format URL valid');
  }
  console.log('');
}

// 3. Cek Format API Key
if (process.env.SUPABASE_ANON_KEY) {
  const key = process.env.SUPABASE_ANON_KEY;
  console.log('   Checking SUPABASE_ANON_KEY Format:');
  console.log('   Key length:', key.length, 'characters');
  console.log('   Key preview:', key.substring(0, 20) + '...');
  
  if (key.length < 100) {
    console.log('   ⚠️  WARNING: API key terlalu pendek (biasanya > 100 karakter)');
  } else {
    console.log('   ✅ Key length valid');
  }
  console.log('');
}

// 4. Test Koneksi Supabase
async function testConnection() {
  console.log('4️⃣ Testing Supabase Connection:');
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log('   ❌ ERROR: SUPABASE_URL atau SUPABASE_ANON_KEY tidak di-set');
      console.log('   💡 Solusi: Buat file .env dengan SUPABASE_URL dan SUPABASE_ANON_KEY');
      process.exit(1);
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    console.log('   Creating Supabase client...');
    
    // Test 1: Query sederhana ke tabel users
    console.log('   Testing query to users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      if (usersError.code === 'PGRST116') {
        console.log('   ✅ Connection OK (table users empty or not found)');
      } else if (usersError.message.includes('Invalid API key') || usersError.message.includes('JWT')) {
        console.log('   ❌ ERROR: Invalid API key');
        console.log('   💡 Solusi:');
        console.log('      1. Buka Supabase Dashboard → Settings → API');
        console.log('      2. Copy "anon public" key (bukan service role key)');
        console.log('      3. Update SUPABASE_ANON_KEY di file .env');
        console.log('      4. Restart server');
      } else if (usersError.message.includes('relation') || usersError.message.includes('does not exist')) {
        console.log('   ⚠️  WARNING: Table users tidak ditemukan');
        console.log('   💡 Solusi: Jalankan schema.sql untuk membuat tabel');
      } else {
        console.log('   ❌ ERROR:', usersError.message);
        console.log('   Code:', usersError.code);
      }
    } else {
      console.log('   ✅ Connection successful!');
    }

    // Test 2: Query ke tabel otp_codes
    console.log('   Testing query to otp_codes table...');
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('count')
      .limit(1);

    if (otpError) {
      if (otpError.code === 'PGRST116') {
        console.log('   ✅ Table otp_codes accessible (empty)');
      } else if (otpError.message.includes('relation') || otpError.message.includes('does not exist')) {
        console.log('   ⚠️  WARNING: Table otp_codes tidak ditemukan');
        console.log('   💡 Solusi: Jalankan schema.sql untuk membuat tabel');
      } else {
        console.log('   ⚠️  WARNING:', otpError.message);
      }
    } else {
      console.log('   ✅ Table otp_codes accessible');
    }

    // Test 3: Insert test (read-only check)
    console.log('   Testing insert permission...');
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert([{
        email: 'test@example.com',
        code: '000000',
        purpose: 'email_verification',
        expires_at: new Date(Date.now() + 600000).toISOString()
      }])
      .select();

    if (insertError) {
      if (insertError.message.includes('permission') || insertError.message.includes('policy')) {
        console.log('   ⚠️  WARNING: Row Level Security (RLS) mungkin aktif');
        console.log('   💡 Solusi: Disable RLS untuk development atau setup policy');
      } else {
        console.log('   ⚠️  WARNING:', insertError.message);
      }
    } else {
      console.log('   ✅ Insert permission OK');
      // Cleanup test data
      await supabase.from('otp_codes').delete().eq('email', 'test@example.com');
    }

    console.log('');
    console.log('✅ Supabase connection test completed!');

  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Pastikan file .env ada di root project');
    console.log('   2. Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY sudah di-set');
    console.log('   3. Pastikan @supabase/supabase-js sudah terinstall: npm install @supabase/supabase-js');
    console.log('   4. Cek apakah Supabase project masih aktif');
    process.exit(1);
  }
}

testConnection();
