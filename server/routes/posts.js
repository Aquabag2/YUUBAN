const router = require('express').Router();
const sb     = require('../lib/supabase');
const { requireAuth, requireAdmin, canManageEvent } = require('../middleware/auth');
const { PAYMENTS_ENABLED } = require('../lib/registration');

// ── GET posts de un evento (inscritos y admins) ───────────────────────────────
router.get('/e/:slug/posts', requireAuth, async (req, res) => {
  if (!sb) return res.json([]);

  const { data: ev } = await sb.from('events').select('id').eq('slug', req.params.slug).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });

  const { data, error } = await sb
    .from('posts')
    .select('id, type, title, content, is_pinned, created_at, author:author_id(id)')
    .eq('event_id', ev.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ── GET posts de todos los eventos del usuario (feed del alumno) ──────────────
router.get('/my/feed', requireAuth, async (req, res) => {
  if (!sb) return res.json([]);

  // Buscar registrations del usuario por su email
  const { data: profile } = await sb
    .from('user_profiles')
    .select('email')
    .eq('id', req.user.id)
    .single();

  const email = profile?.email || req.user.email;

  const { data: regs } = await sb
    .from('registrations')
    .select('event_id')
    .eq('email', email);

  if (!regs?.length) return res.json([]);

  const eventIds = regs.map(r => r.event_id);

  const { data, error } = await sb
    .from('posts')
    .select('id, type, title, content, is_pinned, created_at, events(title, slug, cover_color)')
    .in('event_id', eventIds)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ── GET panel "Tu día" del alumno: boletos, horario y anuncios fijados ─────────
// Solo de los eventos donde está inscrito con el correo de su cuenta
router.get('/my/overview', requireAuth, async (req, res) => {
  if (!sb || !req.user.email) return res.json({ tickets: [], schedule: [], pinned: [] });

  const COLS = 'event_id, ticket_token, paid, checked_in, ticket_type_name, events(id, title, date, location, slug, cover_color, price_cents)';
  const query = (cols) => sb.from('registrations').select(cols)
    .eq('email', req.user.email.toLowerCase()).order('created_at', { ascending: false });
  // certificate_url existe solo si se corrió certificate_templates.sql
  let { data: regs, error: regErr } = await query(`${COLS}, certificate_url`);
  if (regErr) ({ data: regs } = await query(COLS));

  const tickets = (regs ?? []).filter((r) => r.events).map((r) => ({
    ticket_token: r.ticket_token,
    ticket_type_name: r.ticket_type_name,
    checked_in: r.checked_in,
    has_certificate: !!r.certificate_url,
    // Pendiente solo si el evento cobra y aún no paga
    pending_payment: PAYMENTS_ENABLED && (r.events.price_cents ?? 0) > 0 && !r.paid,
    event: { title: r.events.title, date: r.events.date, location: r.events.location, slug: r.events.slug, cover_color: r.events.cover_color },
  }));
  if (!tickets.length) return res.json({ tickets, schedule: [], pinned: [] });

  const eventIds = [...new Set(regs.map((r) => r.event_id))];
  const byId = Object.fromEntries(regs.filter((r) => r.events).map((r) => [r.event_id, r.events]));

  const [schedRes, pinnedRes] = await Promise.all([
    sb.from('schedule_items').select('id, event_id, start_time, end_time, title, place')
      .in('event_id', eventIds).order('start_time'),
    sb.from('posts').select('id, type, title, created_at, event_id')
      .in('event_id', eventIds).eq('is_pinned', true)
      .order('created_at', { ascending: false }).limit(5),
  ]);

  const withEvent = (row) => ({ ...row, event: { title: byId[row.event_id]?.title, slug: byId[row.event_id]?.slug } });
  res.json({
    tickets,
    schedule: (schedRes.data ?? []).map(withEvent),
    pinned:   (pinnedRes.data ?? []).map(withEvent),
  });
});

// ── Vista previa del inicio del alumno para un evento (dueño o super_admin) ────
// Mismas formas que /my/feed y /my/overview, como si el alumno estuviera inscrito
const previewEvent = async (req, res) => {
  const { data: ev } = await sb.from('events')
    .select('id, title, date, location, slug, cover_color').eq('slug', req.params.slug).maybeSingle();
  if (!ev) { res.status(404).json({ error: 'Evento no encontrado' }); return null; }
  if (!(await canManageEvent(req, ev.id))) { res.status(403).json({ error: 'No autorizado' }); return null; }
  return ev;
};

router.get('/preview/:slug/feed', requireAdmin, async (req, res) => {
  if (!sb) return res.json([]);
  const ev = await previewEvent(req, res);
  if (!ev) return;
  const { data, error } = await sb.from('posts')
    .select('id, type, title, content, is_pinned, created_at, events(title, slug, cover_color)')
    .eq('event_id', ev.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: 'No se pudo cargar el feed' });
  res.json(data ?? []);
});

router.get('/preview/:slug/overview', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ tickets: [], schedule: [], pinned: [] });
  const ev = await previewEvent(req, res);
  if (!ev) return;
  const [schedRes, pinnedRes] = await Promise.all([
    sb.from('schedule_items').select('id, event_id, start_time, end_time, title, place').eq('event_id', ev.id).order('start_time'),
    sb.from('posts').select('id, type, title, created_at, event_id').eq('event_id', ev.id).eq('is_pinned', true)
      .order('created_at', { ascending: false }).limit(5),
  ]);
  const event = { title: ev.title, slug: ev.slug };
  res.json({
    // Boleto de ejemplo: así se ve, pero no abre ningún QR real
    tickets: [{ ticket_token: null, sample: true, ticket_type_name: 'Boleto de ejemplo', checked_in: false, pending_payment: false, has_certificate: false,
      event: { title: ev.title, date: ev.date, location: ev.location, slug: ev.slug, cover_color: ev.cover_color } }],
    schedule: (schedRes.data ?? []).map((r) => ({ ...r, event })),
    pinned:   (pinnedRes.data ?? []).map((r) => ({ ...r, event })),
  });
});

// ── POST crear post (admin) ───────────────────────────────────────────────────
router.post('/e/:slug/posts', requireAdmin, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });

  const { title, content, type, is_pinned } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });

  const validTypes = ['announcement', 'schedule', 'result', 'winner'];
  if (type && !validTypes.includes(type))
    return res.status(400).json({ error: 'Tipo inválido' });

  const { data: ev } = await sb.from('events').select('id, user_id').eq('slug', req.params.slug).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  if (!(await canManageEvent(req, ev.id))) return res.status(403).json({ error: 'No autorizado' });

  const { data, error } = await sb
    .from('posts')
    .insert({
      event_id:  ev.id,
      author_id: req.user.id,
      type:      type || 'announcement',
      title:     title.trim(),
      content:   content?.trim() || null,
      is_pinned: !!is_pinned,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── PUT editar post ───────────────────────────────────────────────────────────
router.put('/posts/:id', requireAdmin, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });

  const { title, content, type, is_pinned } = req.body;
  if (type && !['announcement', 'schedule', 'result', 'winner'].includes(type))
    return res.status(400).json({ error: 'Tipo inválido' });

  const { data: post } = await sb.from('posts').select('event_id').eq('id', req.params.id).single();
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });
  if (!(await canManageEvent(req, post.event_id))) return res.status(403).json({ error: 'No autorizado' });

  const { data, error } = await sb
    .from('posts')
    .update({
      title:      title?.trim(),
      content:    content?.trim() || null,
      type,
      is_pinned:  !!is_pinned,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── DELETE post ───────────────────────────────────────────────────────────────
router.delete('/posts/:id', requireAdmin, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });
  const { data: post } = await sb.from('posts').select('event_id').eq('id', req.params.id).maybeSingle();
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });
  if (!(await canManageEvent(req, post.event_id))) return res.status(403).json({ error: 'No autorizado' });
  const { error } = await sb.from('posts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
