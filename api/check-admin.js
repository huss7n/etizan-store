import supabase from './_supabase.js';
import { setCorsHeaders, handleCorsPreflight } from './cors-config.js';

// Check admin status and permissions
export default async function handler(req, res) {
  const origin = req.headers.origin;
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(req, res);
  }
  
  setCorsHeaders(res, origin);

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'غير مصرح به' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'توكن غير صالح' });
    }

    // Get admin details
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return res.status(403).json({ error: 'لست مشرفاً' });
    }

    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Define permissions based on role
    const permissions = {
      canManageProducts: admin.role === 'super_admin',
      canManageOrders: true,
      canManageSettings: admin.role === 'super_admin',
      canManageAdmins: admin.role === 'super_admin',
      canViewStats: true,
      role: admin.role
    };

    return res.status(200).json({
      isAdmin: true,
      role: admin.role,
      permissions,
      email: admin.email,
      full_name: admin.full_name
    });

  } catch (err) {
    console.error('Check admin error:', err);
    res.status(500).json({ error: err.message });
  }
}