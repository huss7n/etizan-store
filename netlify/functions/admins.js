import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function isSuperAdmin(userId) {
  const { data } = await supabase
    .from('admins')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  return data?.role === 'super_admin';
}

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    if (event.httpMethod === 'GET') {
      const { data: admins, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(admins) };
    }

    if (event.httpMethod === 'POST') {
      if (!await isSuperAdmin(user.id)) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
      }

      const { email, password, full_name, role } = JSON.parse(event.body);

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: authError.message }) };
      }

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

      return { statusCode: 201, headers, body: JSON.stringify(adminData) };
    }

    if (event.httpMethod === 'DELETE') {
      if (!await isSuperAdmin(user.id)) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
      }

      const { id } = JSON.parse(event.body);
      const { data: adminToDelete } = await supabase
        .from('admins')
        .select('user_id')
        .eq('id', id)
        .single();

      if (adminToDelete) {
        await supabase.auth.admin.deleteUser(adminToDelete.user_id);
        await supabase.from('admins').delete().eq('id', id);
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};