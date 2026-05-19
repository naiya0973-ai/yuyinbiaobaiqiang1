const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
};

function createSupabaseInstance(keyName, keyValue) {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is required');
  }

  if (!keyValue) {
    throw new Error(`${keyName} is required`);
  }

  return createClient(supabaseUrl, keyValue, clientOptions);
}

const supabaseAdmin = createSupabaseInstance('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey);
const supabaseClient = createSupabaseInstance('SUPABASE_ANON_KEY', supabaseAnonKey);

module.exports = {
  supabaseAdmin,
  supabaseClient
};
