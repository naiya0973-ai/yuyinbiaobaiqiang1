const { createClient } = require('@supabase/supabase-js');

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
};

let supabaseAdminInstance = null;
let supabaseClientInstance = null;

function createSupabaseInstance(keyName, keyValue) {
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is required');
  }

  if (!keyValue) {
    throw new Error(`${keyName} is required`);
  }

  return createClient(supabaseUrl, keyValue, clientOptions);
}

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createSupabaseInstance(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseAdminInstance;
}

function getSupabaseClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createSupabaseInstance(
      'SUPABASE_ANON_KEY',
      process.env.SUPABASE_ANON_KEY
    );
  }
  return supabaseClientInstance;
}

module.exports = {
  get supabaseAdmin() {
    return getSupabaseAdmin();
  },
  get supabaseClient() {
    return getSupabaseClient();
  }
};
