import { createClient } from "@supabase/supabase-js";

// Use Vite env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing in VITE env vars. Uploads involving Supabase will fail.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
    auth: {
        persistSession: true, // Optional for this use case but standard for FE
    },
});
