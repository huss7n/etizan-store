import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.NEXT_PUBLIC_SUPABASE_URL as string);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
