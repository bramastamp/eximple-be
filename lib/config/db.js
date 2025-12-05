const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing!');
    console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    console.error('Example .env file:');
    console.error('SUPABASE_URL=https://your-project.supabase.co');
    console.error('SUPABASE_ANON_KEY=your-anon-key-here');
    console.error('Run: node debug_db.js to test connection');
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}

if (supabaseUrl && (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))) {
    console.error('Invalid SUPABASE_URL format!');
    console.error('URL must start with http:// or https://');
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}

let supabase;
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    (async () => {
        try {
            const { data, error } = await supabase.from('users').select('count').limit(1);
            if (error && error.code !== 'PGRST116') {
                if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
                    console.error('Supabase connection error: Invalid API key');
                    console.error('Please check your SUPABASE_ANON_KEY in .env file');
                    console.error('Run: node debug_db.js to test connection');
                } else {
                    console.error('Supabase connection error:', error.message);
                }
            } else {
                console.log('Supabase connected successfully');
            }
        } catch (err) {
            console.error('Failed to connect to Supabase:', err.message);
        }
    })();
} else {
    console.error('Supabase client not initialized - missing credentials');
}

module.exports = supabase;