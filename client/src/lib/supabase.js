import { createClient } from '@supabase/supabase-js';

// Se lee ANTES de crear el cliente: Supabase limpia el hash de la URL al procesar la sesión.
// Si el link de "Reset password" cae en otra ruta (p. ej. el Site URL "/"), así lo detectamos igual.
export const isRecoveryLink = window.location.hash.includes('type=recovery');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default supabase;
