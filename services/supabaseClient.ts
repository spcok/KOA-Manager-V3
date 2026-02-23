
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Go to Supabase Dashboard -> Project Settings -> API
// Paste your Project URL and anon Key below.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase environment variables not configured. Please check your .env file.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
