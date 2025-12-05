const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing! Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}

if (supabaseUrl && (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))) {
    console.error('Invalid SUPABASE_URL format! URL must start with http:// or https://');
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
                    console.error('Supabase connection error: Invalid API key. Check SUPABASE_ANON_KEY in .env');
                } else {
                    console.error('Supabase connection error:', error.message);
                }
            }
        } catch (err) {
            console.error('Failed to connect to Supabase:', err.message);
        }
    })();
} else {
    console.error('Supabase client not initialized - missing credentials');
}

module.exports = supabase;