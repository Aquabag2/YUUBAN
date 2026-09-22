const supabase = require('../lib/supabase');

// Verifica el JWT localmente con el secret de Supabase — sin llamadas de red.
// Supabase firma todos sus tokens con HS256 usando SUPABASE_JWT_SECRET.
const verifyJWT = (token) => {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (!payload?.sub) return null;
    return { id: payload.sub, email: payload.email ?? null };
  } catch (e) {
    console.error('[auth] JWT verify error:', e.message);
    return null;
  }
};

// Verifica con Supabase API (solo si no hay JWT secret configurado)
const verifyWithSupabase = async (token) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) { console.error('[auth] supabase.getUser error:', error.message); return null; }
    return data?.user ?? null;
  } catch (e) {
    console.error('[auth] supabase.getUser exception:', e.message);
    return null;
  }
};

const getUser = async (token) => {
  // Primero: verificación local con JWT secret (rápido, sin red)
  const localUser = verifyJWT(token);
  if (localUser) return localUser;

  // Fallback: llamada a Supabase API (requiere red)
  return verifyWithSupabase(token);
};

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const user = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Sesión expirada — vuelve a iniciar sesión' });
  req.user = user;
  next();
};

const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const user = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Sesión expirada — vuelve a iniciar sesión' });

  if (supabase) {
    const { data: profile } = await supabase
      .from('user_profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'super_admin'].includes(profile?.role))
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
    req.role = profile.role;
  }

  req.user = user;
  next();
};

const requireSuperAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const user = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Sesión expirada — vuelve a iniciar sesión' });

  if (supabase) {
    const { data: profile } = await supabase
      .from('user_profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin')
      return res.status(403).json({ error: 'Acceso denegado: se requiere super_admin' });
  }

  req.user = user;
  next();
};

module.exports = { requireAuth, requireAdmin, requireSuperAdmin };
