const supabase = require('../lib/supabase');

const getUser = async (token) => {
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.error('[auth] getUser error:', error.message, '| token prefix:', token?.slice(0, 20));
  }
  return { user: data?.user ?? null, error };
};

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!supabase) return next(); // modo mock sin Supabase

  const { user, error } = await getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Token inválido o expirado' });
  req.user = user;
  next();
};

const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!supabase) return next();

  const { user, error } = await getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Token inválido o expirado' });

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

  const { user, error } = await getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Token inválido o expirado' });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'super_admin')
    return res.status(403).json({ error: 'Acceso denegado: se requiere super_admin' });

  req.user = user;
  next();
};

module.exports = { requireAuth, requireAdmin, requireSuperAdmin };
