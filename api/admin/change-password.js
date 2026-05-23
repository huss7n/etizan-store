import supabase from '../_supabase.js';
import { setCorsHeaders, handleCorsPreflight } from '../cors-config.js';
import { hashPassword, verifyPassword } from '../_utils/security.js';

// Admin password change endpoint
export default async function handler(req, res) {
  const origin = req.headers.origin;
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(req, res);
  }
  
  setCorsHeaders(res, origin);
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { currentPassword, newPassword, adminToken } = req.body;
    
    // Verify admin is authenticated
    if (!adminToken) {
      return res.status(401).json({ error: 'غير مصرح به' });
    }
    
    // Get current settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    if (settingsError || !settings) {
      return res.status(500).json({ error: 'فشل في الوصول إلى الإعدادات' });
    }
    
    // Verify current password
    if (currentPassword !== settings.admin_password) {
      return res.status(403).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'كلمة المرور جديدة يجب أن تكون ٨ أحرف على الأقل' 
      });
    }
    
    // Update password
    const { error: updateError } = await supabase
      .from('settings')
      .update({ admin_password: newPassword })
      .eq('id', settings.id);
    
    if (updateError) {
      return res.status(500).json({ error: 'فشل في تحديث كلمة المرور' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح' 
    });
    
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'حدث خطأ غير متوقع' });
  }
}