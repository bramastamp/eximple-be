const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}

if (supabaseUrl && (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))) {
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
                // Supabase connection error
            }
        } catch (err) {
            // Failed to connect to Supabase
        }
    })();
}

module.exports = supabase;
