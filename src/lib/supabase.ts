import { createClient } from '@supabase/supabase-js'

// قراءة المتغيرات بالشكل المتوافق مع الكود الرئيسي للمتجر
const supabaseUrl = (import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gufeacwtjliyrqoislbu.supabase.co') as string;
const supabaseAnonKey = (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_f1CMmdGCCKNxUwedH4CyNQ_NMVD9z-b') as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase;
