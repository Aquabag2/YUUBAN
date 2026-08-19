const router = require('express').Router();
const sb     = require('../lib/supabase');
const MOCK   = require('../lib/mock');
const { requireSuperAdmin } = require('../middleware/auth');

const pick = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));

// ── Listar clientes ────────────────────────────────────────────────────────────
router.get('/clients', requireSuperAdmin, async (_req, res) => {
  if (!sb) return res.json(MOCK.superClients);
  const { data, error } = await sb
    .from('clients')
    .select('*, events(id, slug, title, is_published)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ── Crear cliente (invita por email) ──────────────────────────────────────────
router.post('/clients', requireSuperAdmin, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const { name, contact, email, plan, mrr, notes } = req.body;
  if (!name?.trim() || !email?.trim())
    return res.status(400).json({ error: 'Nombre y email son obligatorios' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email no válido' });

  const { data: invited, error: inviteErr } = await sb.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(), { data: { role: 'admin' } }
  );
  if (inviteErr && !inviteErr.message.includes('already'))
    return res.status(400).json({ error: inviteErr.message });

  const userId = invited?.user?.id;
  if (userId)
    await sb.from('user_profiles').upsert({ id: userId, role: 'admin' }, { onConflict: 'id' });

  const { data: client, error: clientErr } = await sb.from('clients').insert({
    admin_id: userId ?? null,
    name: name.trim(), contact: contact?.trim() || null,
    email: email.trim().toLowerCase(),
    plan: plan ?? 'Básico',
    mrr: mrr ? parseInt(mrr) : 0,
    notes: notes?.trim() || null,
  }).select().single();

  if (clientErr) {
    console.error('[super/clients POST] clientErr:', clientErr);
    return res.status(500).json({ error: clientErr.message });
  }
  res.status(201).json({ ...client, message: invited?.user ? `Invitación enviada a ${email}` : 'Cliente creado.' });
});

// ── Editar cliente ─────────────────────────────────────────────────────────────
router.put('/clients/:id', requireSuperAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const fields = pick(req.body, ['name', 'contact', 'plan', 'status', 'mrr', 'notes']);
  if (fields.mrr !== undefined) fields.mrr = parseInt(fields.mrr) || 0;
  const { data, error } = await sb.from('clients').update(fields).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Eliminar cliente ───────────────────────────────────────────────────────────
router.delete('/clients/:id', requireSuperAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { error } = await sb.from('clients').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Métricas globales ──────────────────────────────────────────────────────────
router.get('/metrics', requireSuperAdmin, async (_req, res) => {
  if (!sb) return res.json(MOCK.superMetrics);
  const { data: cls } = await sb.from('clients').select('mrr, status, created_at');
  if (!cls) return res.json(MOCK.superMetrics);
  const now = new Date();
  const active = cls.filter((c) => c.status === 'Activo');
  const mrr    = active.reduce((s, c) => s + (c.mrr || 0), 0);
  const newThisMonth = cls.filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const { count: evCount } = await sb.from('events').select('*', { count: 'exact', head: true });
  res.json({
    mrr: mrr > 0 ? `$${mrr.toLocaleString()}` : '$0',
    activeClients: active.length, totalEvents: evCount ?? 0,
    platformUptime: '99.9%', newThisMonth, churnThisMonth: 0,
  });
});

// ── Todos los eventos de todos los clientes (con stats) ────────────────────────
router.get('/events', requireSuperAdmin, async (_req, res) => {
  if (!sb) return res.json([]);

  const [evRes, clRes] = await Promise.all([
    sb.from('events')
      .select('id, title, location, date, slug, is_published, price_cents, created_at, user_id, registrations(id, paid)')
      .order('is_published', { ascending: false })
      .order('created_at', { ascending: false }),
    sb.from('clients').select('admin_id, name, email'),
  ]);

  if (evRes.error) return res.status(500).json({ error: evRes.error.message });

  // map admin_id → client
  const clientMap = {};
  (clRes.data ?? []).forEach((c) => { if (c.admin_id) clientMap[c.admin_id] = c; });

  const events = (evRes.data ?? []).map((e) => ({
    ...e,
    client:              clientMap[e.user_id] ?? null,
    total_registrations: e.registrations?.length ?? 0,
    paid_registrations:  e.registrations?.filter((r) => r.paid).length ?? 0,
    revenue_cents:       (e.registrations?.filter((r) => r.paid).length ?? 0) * (e.price_cents ?? 0),
    registrations:       undefined, // no exponer lista completa
  }));

  res.json(events);
});

// ── Editar cualquier evento en nombre del cliente ──────────────────────────────
router.put('/events/:id', requireSuperAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const allowed = ['title', 'location', 'date', 'summary', 'slug', 'is_published', 'price_cents'];
  const fields  = pick(req.body, allowed);
  if (!Object.keys(fields).length) return res.status(400).json({ error: 'Sin campos válidos' });
  const { data, error } = await sb.from('events').update(fields).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
