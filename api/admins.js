import supabase from './_supabase.js';

// Check if user is super admin
async function isSuperAdmin(userId) {
  const { data } = await supabase
    .from('admins')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  return data?.role === 'super_admin';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'GET') {
      const { data: admins, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(admins);
    }

    if (req.method === 'POST') {
      if (!await isSuperAdmin(user.id)) {
        return res.status(403).json({ error: 'Only super admin can add admins' });
      }

      const { email, password, full_name, role } = req.body;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) return res.status(400).json({ error: authError.message });

      // Add to admins table
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: authData.user.id,
          email,
          full_name,
          role: role || 'moderator',
          created_by: user.id
        })
        .select()
        .single();

      if (adminError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw adminError;
      }

      return res.status(201).json(adminData);
    }

    if (req.method === 'DELETE') {
      if (!await isSuperAdmin(user.id)) {
        return res.status(403).json({ error: 'Only super admin can delete admins' });
      }

      const { id } = req.body;
      const { data: adminToDelete } = await supabase
        .from('admins')
        .select('user_id')
        .eq('id', id)
        .single();

      if (adminToDelete) {
        await supabase.auth.admin.deleteUser(adminToDelete.user_id);
        await supabase.from('admins').delete().eq('id', id);
      }

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admins API error:', err);
    res.status(500).json({ error: err.message });
  }
}