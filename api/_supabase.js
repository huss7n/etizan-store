const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   'https://ziafttjpcljhkqnwnetg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                   'sb_secret_0emttB5ThKbrwL8knTFB9Q_uqYY_0Xn';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
module.exports.default = supabase;
