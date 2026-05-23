import { createClient } from '@supabase/supabase-js';

// Support both Vite and Next.js env variable naming
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://ziafttjpcljhkqnwnetg.supabase.co';
  
const supabaseKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'sb_publishable_4g-JaCrI1gmMTnu2d7UQ1Q_IqBancmd';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: 'books' | 'courses' | 'templates';
  image_url: string;
  file_url: string;
  featured: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  product_id: string;
  product_name: string;
  amount: number;
  payment_method: 'zain_cash' | 'asia_hwalah' | 'tif_bank';
  receipt_image: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at?: string;
};

export type Settings = {
  id?: string;
  zain_cash_number: string;
  asia_hwalah_number: string;
  tif_bank_number: string;
  admin_password: string;
  whatsapp_number: string;
};