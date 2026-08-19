const supabase = require('../lib/supabase');

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!supabase) return next();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Token inválido o expirado' });
  req.user = user;
  next();
};

const requireSuperAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!supabase) return next();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Token inválido o expirado' });
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'super_admin')
    return res.status(403).json({ error: 'Acceso denegado: se requiere super_admin' });
  req.user = user;
  next();
};

module.exports = { requireAuth, requireSuperAdmin };
