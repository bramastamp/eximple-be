const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing!');
    console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    console.error('');
    console.error('Example .env file:');
    console.error('SUPABASE_URL=https://your-project.supabase.co');
    console.error('SUPABASE_ANON_KEY=your-anon-key-here');
    process.exit(1);
}

// Validate URL format
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.error('❌ Invalid SUPABASE_URL format!');
    console.error('URL must start with http:// or https://');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
(async () => {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase connection error:', error.message);
            console.error('Please check your SUPABASE_URL and SUPABASE_ANON_KEY');
        } else {
            console.log('✅ Supabase connected successfully');
        }
    } catch (err) {
        console.error('❌ Failed to connect to Supabase:', err.message);
    }
})();

module.exports = supabase;