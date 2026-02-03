import { createClient } from "@supabase/supabase-js";

// Use Vite env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 4. Verify at Runtime (Debug Step)
console.log('SUPABASE URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase frontend environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
    },
});
