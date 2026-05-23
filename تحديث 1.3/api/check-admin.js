import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !admin) return res.status(403).json({ error: 'Not an admin' });

    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

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