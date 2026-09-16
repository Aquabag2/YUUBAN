require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  const opts = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  };
  try {
    const ws = require('ws');
    opts.realtime = { transport: ws };
  } catch { /* Node 20+ tiene WebSocket nativo */ }

  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    opts
  );
}

module.exports = supabase;
