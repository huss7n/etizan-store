import { createClient } from '@supabase/supabase-js'

// قراءة المتغيرات بالشكل المتوافق مع Vite و Next في نفس الوقت
const supabaseUrl = (import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '') as string;
const supabaseAnonKey = (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '') as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing.');
}

// تصدير مسمى ليتوافق مع استدعاءات الملفات الأخرى بداخل المشروع
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// تصدير افتراضي احتياطي من أجل تفادي أي تعارض
export default supabase;
