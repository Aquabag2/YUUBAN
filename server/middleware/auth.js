const supabase = require('../lib/supabase');

// Intenta verificar el JWT directamente con el secret de Supabase
// como respaldo cuando getUser() falla (mismatch de proyecto, etc.)
const tryJWTFallback = (token) => {
  try {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) return null;
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, secret);
    // Supabase JWT tiene sub = user id, email en payload
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
};

const getUser = async (token) => {
  if (!supabase) return { user: null, error: new Error('Sin Supabase') };

  const { data, error } = await supabase.auth.getUser(token);
  if (!error && data?.user) return { user: data.user, error: null };

  // Log para Railway
  console.error('[auth] getUser falló:', error?.message, '— intentando JWT fallback');

  // Fallback: verificar con JWT secret directamente
  const fallbackUser = tryJWTFallback(token);
  if (fallbackUser) {
    console.log('[auth] JWT fallback OK para', fallbackUser.email);
    return { user: fallbackUser, error: null };
  }

  return { user: null, error };
};

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!supabase) return next();

  const { user, error } = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Token inválido o expirado' });
  req.user = user;
  next();
};

const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!supabase) return next();

  const { user } = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Token inválido o expirado' });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();

  if (!['admin', 'super_admin'].includes(profile?.role))
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });

  req.user = user;
  req.role = profile.role;
  next();
};

const requireSuperAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!supabase) return next();

  const { user } = await getUser(token);
  if (!user) return res.status(401).json({ error: 'Token inválido o expirado' });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'super_admin')
    return res.status(403).json({ error: 'Acceso denegado: se requiere super_admin' });

  req.user = user;
  next();
};

module.exports = { requireAuth, requireAdmin, requireSuperAdmin };
