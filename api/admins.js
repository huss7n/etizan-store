import supabase from './_supabase.js';
import { setCorsHeaders, handleCorsPreflight } from './cors-config.js';

// Check if user is super admin
async function isSuperAdmin(userId) {
  const { data, error } = await supabase
    .from('admins')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  
  return data?.role === 'super_admin';
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(req, res);
  }
  
  setCorsHeaders(res, origin);

  try {
    // Get current user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'غير مصرح به' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'توكن غير صالح' });
    }

    if (req.method === 'GET') {
      // Check if requesting user is admin
      const { data: requestingAdmin } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!requestingAdmin) {
        return res.status(403).json({ error: 'غير مصرح بالوصول' });
      }

      const { data: admins, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(admins);
    }

    if (req.method === 'POST') {
      // Only super admin can create new admins
      if (!await isSuperAdmin(user.id)) {
        return res.status(403).json({ error: 'ليس لديك صلاحية إضافة مشرفين' });
      }

      const { email, password, full_name, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبان' });
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

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
        // Rollback auth user creation
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw adminError;
      }

      return res.status(201).json(adminData);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      
      // Check permissions
      const { data: requestingAdmin } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!requestingAdmin || (requestingAdmin.role !== 'super_admin' && updates.role)) {
        return res.status(403).json({ error: 'غير مصرح بتعديل الصلاحيات' });
      }

      const { data, error } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      // Only super admin can delete admins
      if (!await isSuperAdmin(user.id)) {
        return res.status(403).json({ error: 'ليس لديك صلاحية حذف مشرفين' });
      }

      const { id } = req.body;

      // Get admin to delete
      const { data: adminToDelete } = await supabase
        .from('admins')
        .select('user_id')
        .eq('id', id)
        .single();

      if (adminToDelete) {
        // Delete from auth
        await supabase.auth.admin.deleteUser(adminToDelete.user_id);
        
        // Delete from admins table
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admins API error:', err);
    res.status(500).json({ error: err.message });
  }
}