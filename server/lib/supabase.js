require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  try {
    const ws = require('ws');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { realtime: { transport: ws } }
    );
  } catch {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
}

module.exports = supabase;
