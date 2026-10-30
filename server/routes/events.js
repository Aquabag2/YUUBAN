const router  = require('express').Router();
const sb       = require('../lib/supabase');
const MOCK     = require('../lib/mock');
const { requireAuth, requireAdmin, canManageEvent } = require('../middleware/auth');
const { sendTicketEmail } = require('../lib/email');

const { PAYMENTS_ENABLED, publicPrice, validateAttendee, resolveTicketType } = require('../lib/registration');

const pick = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));

const EVENT_FIELDS = ['title', 'location', 'date', 'summary', 'slug', 'cover_color', 'is_published', 'price_cents'];

// ── Todos los eventos publicados ───────────────────────────────────────────────
router.get('/events/published', requireAuth, async (_req, res) => {
  if (!sb) return res.json([MOCK.event]);
  const { data, error } = await sb
    .from('events')
    .select('id, title, location, date, summary, slug, cover_color, price_cents')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data ?? []).map(publicPrice));
});

// ── Primer evento (ruta legada) ───────────────────────────────────────────────
router.get('/event', async (_req, res) => {
  if (!sb) return res.json(MOCK.event);
  const { data, error } = await sb.from('events')
    .select('id, title, location, date, summary, slug, cover_color, price_cents')
    .eq('is_published', true).limit(1).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Eventos del admin — soporta múltiples eventos ─────────────────────────────
router.get('/my-event', requireAuth, async (req, res) => {
  if (!sb) return res.json([{ ...MOCK.event, slug: 'demo-event' }]);
  const { data } = await sb.from('events')
    .select('*').eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  res.json(data ?? []);
});

router.post('/my-event', requireAdmin, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const fields = pick(req.body, EVENT_FIELDS);
  if (!fields.title?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });
  if (!fields.slug)
    fields.slug = fields.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 60);
  const { data, error } = await sb.from('events')
    .insert({ ...fields, user_id: req.user.id }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/my-event/:id', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const fields = pick(req.body, EVENT_FIELDS);
  if (fields.price_cents !== undefined) fields.price_cents = parseInt(fields.price_cents) || 0;
  const { data, error } = await sb.from('events')
    .update(fields).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/my-event/:id', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { error } = await sb.from('events')
    .delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Inscritos del evento del admin ────────────────────────────────────────────
router.get('/my-event/:id/registrations', requireAdmin, async (req, res) => {
  if (!sb) return res.json([]);
  if (!(await canManageEvent(req, req.params.id))) return res.status(403).json({ error: 'No autorizado' });
  const [{ data, error }, { data: ev }, { data: types }] = await Promise.all([
    sb.from('registrations').select('*').eq('event_id', req.params.id).order('created_at', { ascending: false }),
    sb.from('events').select('price_cents').eq('id', req.params.id).maybeSingle(),
    sb.from('event_ticket_types').select('id, price_cents').eq('event_id', req.params.id),
  ]);
  if (error) return res.status(500).json({ error: 'No se pudieron cargar los inscritos' });
  // Precio de su plan (o el general del evento) para calcular lo recaudado
  const priceOf = new Map((types ?? []).map((t) => [t.id, t.price_cents ?? 0]));
  res.json((data ?? []).map(({ certificate_url, ...r }) => ({
    ...r,
    has_certificate: !!certificate_url,
    price_cents: r.ticket_type_id && priceOf.has(r.ticket_type_id) ? priceOf.get(r.ticket_type_id) : (ev?.price_cents ?? 0),
  })));
});

// El dueño del evento y el super_admin pueden ver la invitación aunque esté en borrador
const canPreview = async (req, ev) => {
  if (ev.user_id === req.user.id) return true;
  const { data } = await sb.from('user_profiles').select('role').eq('id', req.user.id).maybeSingle();
  return data?.role === 'super_admin';
};

// ── Página pública del evento ─────────────────────────────────────────────────
router.get('/e/:slug', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ...MOCK.event, slug: req.params.slug, is_published: true });
  const { data, error } = await sb
    .from('events')
    .select('id, user_id, title, location, date, summary, slug, cover_color, is_published, price_cents')
    .eq('slug', req.params.slug).maybeSingle();
  if (error || !data) return res.status(404).json({ error: 'Evento no encontrado' });
  const manager = await canPreview(req, data);
  if (!data.is_published && !manager) return res.status(404).json({ error: 'Evento no encontrado' });
  const { user_id, ...ev } = publicPrice(data);
  res.json({ ...ev, can_manage: manager });
});

// ── Agenda pública del evento ─────────────────────────────────────────────────
router.get('/e/:slug/schedule', requireAuth, async (req, res) => {
  if (!sb) return res.json(MOCK.schedule);
  const { data: ev } = await sb.from('events').select('id').eq('slug', req.params.slug).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  const { data, error } = await sb
    .from('schedule_items').select('*').eq('event_id', ev.id).order('start_time');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ── Ticket types públicos ─────────────────────────────────────────────────────
router.get('/e/:slug/ticket-types', requireAuth, async (req, res) => {
  if (!sb) return res.json([]);
  const { data: ev } = await sb.from('events').select('id, user_id, is_published').eq('slug', req.params.slug).maybeSingle();
  if (!ev || (!ev.is_published && !(await canPreview(req, ev)))) return res.json([]);
  const { data } = await sb.from('event_ticket_types')
    .select('id, name, description, price_cents, capacity')
    .eq('event_id', ev.id).eq('is_active', true)
    .order('sort_order').order('price_cents');
  res.json((data ?? []).map(publicPrice));
});

// ── Ticket types admin CRUD ───────────────────────────────────────────────────
router.get('/my-event/:id/ticket-types', requireAdmin, async (req, res) => {
  if (!sb) return res.json([]);
  const { data: ev } = await sb.from('events').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!ev) return res.status(403).json({ error: 'No autorizado' });
  const { data } = await sb.from('event_ticket_types').select('*').eq('event_id', req.params.id).order('sort_order');
  res.json(data ?? []);
});

router.post('/my-event/:id/ticket-types', requireAdmin, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const { data: ev } = await sb.from('events').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!ev) return res.status(403).json({ error: 'No autorizado' });
  const { name, description, price_cents, capacity, sort_order } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
  const { data, error } = await sb.from('event_ticket_types').insert({
    event_id: parseInt(req.params.id), name: name.trim(),
    description: description?.trim() || null,
    price_cents: parseInt(price_cents || 0),
    capacity: capacity ? parseInt(capacity) : null,
    sort_order: parseInt(sort_order || 0),
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/ticket-types/:id', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { data: tt } = await sb.from('event_ticket_types').select('event_id').eq('id', req.params.id).maybeSingle();
  if (!tt || !(await canManageEvent(req, tt.event_id))) return res.status(403).json({ error: 'No autorizado' });
  const allowed = ['name', 'description', 'price_cents', 'capacity', 'sort_order', 'is_active'];
  const updates = pick(req.body, allowed);
  if (updates.price_cents !== undefined) updates.price_cents = parseInt(updates.price_cents || 0);
  if (updates.capacity !== undefined) updates.capacity = updates.capacity ? parseInt(updates.capacity) : null;
  const { data, error } = await sb.from('event_ticket_types').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/ticket-types/:id', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { data: tt } = await sb.from('event_ticket_types').select('event_id').eq('id', req.params.id).maybeSingle();
  if (!tt || !(await canManageEvent(req, tt.event_id))) return res.status(403).json({ error: 'No autorizado' });
  const { error } = await sb.from('event_ticket_types').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Inscripción pública (gratuita o con ticket type gratuito) ─────────────────
// Solo con sesión: el correo del boleto es el de la cuenta (verificado), no uno escrito a mano
router.post('/e/:slug/register', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true, message: 'Demo', ticket_token: 'demo-token', ticket_url: '/ticket/demo-token' });

  const { name, instrument, notes, ticket_type_id } = req.body;
  const email = req.user.email;
  const invalid = validateAttendee({ ...req.body, email });
  if (invalid) return res.status(400).json({ error: invalid });

  const { data: ev } = await sb.from('events')
    .select('id, title, date, location, price_cents').eq('slug', req.params.slug).eq('is_published', true).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });

  // Precio efectivo: el tipo de boleto debe ser de ESTE evento y estar activo
  const plan = await resolveTicketType(ev, ticket_type_id);
  if (plan.error) return res.status(plan.status).json({ error: plan.error });
  const { effectivePrice, ticketTypeName } = plan;
  if (effectivePrice > 0 && PAYMENTS_ENABLED)
    return res.status(400).json({ error: 'Este plan requiere pago. Usa el flujo de pago.' });

  const cleanEmail = email.trim().toLowerCase();
  const { data: existing } = await sb.from('registrations')
    .select('id, ticket_token').eq('event_id', ev.id).eq('email', cleanEmail).maybeSingle();
  if (existing)
    return res.status(409).json({ error: 'Ya estás inscrito', ticket_url: `/ticket/${existing.ticket_token}` });

  const { data: reg, error } = await sb.from('registrations').insert({
    event_id: ev.id, name: name.trim(), email: cleanEmail,
    instrument: instrument?.trim() || null, notes: notes?.trim() || null,
    ticket_type_id: ticket_type_id || null,
    ticket_type_name: ticketTypeName,
  }).select('id, ticket_token').single();

  if (error?.code === '23505') return res.status(409).json({ error: 'Este correo ya está registrado' });
  if (error) return res.status(500).json({ error: 'No se pudo completar el registro' });

  const ticketUrl = `/ticket/${reg.ticket_token}`;
  sendTicketEmail({
    to: cleanEmail, name: name.trim(),
    eventTitle: ev.title ?? 'Evento', eventDate: ev.date, eventLocation: ev.location,
    ticketUrl, paid: false, priceCents: 0,
  }).catch(() => {});

  res.json({ ok: true, message: '¡Registro exitoso!', ticket_token: reg.ticket_token, ticket_url: ticketUrl });
});

// ── Concursos de un evento (admin) ───────────────────────────────────────────
router.get('/my-event/:id/contests', requireAdmin, async (req, res) => {
  if (!sb) return res.json([]);
  const { data: ev } = await sb.from('events').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!ev) return res.status(403).json({ error: 'No autorizado' });
  const { data, error } = await sb.from('contests')
    .select('id, name, category, location, date, results_date, deadline, judge, price_cents')
    .eq('event_id', req.params.id)
    .order('date', { ascending: true });
  if (error) return res.json([]);
  res.json(data ?? []);
});

router.post('/my-event/:id/contests', requireAdmin, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const { data: ev } = await sb.from('events').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!ev) return res.status(403).json({ error: 'No autorizado' });
  const { name, category, location, date, results_date, deadline, judge, price_cents } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
  const { data, error } = await sb.from('contests').insert({
    name: name.trim(), category, location, date, results_date, deadline, judge,
    price_cents: parseInt(price_cents || 0),
    event_id: parseInt(req.params.id),
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/contests/:id', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { data: ct } = await sb.from('contests').select('event_id').eq('id', req.params.id).maybeSingle();
  if (!ct || !(await canManageEvent(req, ct.event_id))) return res.status(403).json({ error: 'No autorizado' });
  const allowed = ['name', 'category', 'location', 'date', 'results_date', 'deadline', 'judge', 'price_cents'];
  const updates = pick(req.body, allowed);
  if (updates.price_cents !== undefined) updates.price_cents = parseInt(updates.price_cents || 0);
  const { data, error } = await sb.from('contests').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/contests/:id', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { data: ct } = await sb.from('contests').select('event_id').eq('id', req.params.id).maybeSingle();
  if (!ct || !(await canManageEvent(req, ct.event_id))) return res.status(403).json({ error: 'No autorizado' });
  const { error } = await sb.from('contests').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Lista de asistentes (staff autenticado) ───────────────────────────────────
router.get('/e/:slug/attendees', requireAdmin, async (req, res) => {
  if (!sb) return res.json([]);
  const { data: ev } = await sb.from('events').select('id').eq('slug', req.params.slug).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  if (!(await canManageEvent(req, ev.id))) return res.status(403).json({ error: 'No autorizado' });
  const { data, error } = await sb
    .from('registrations')
    .select('id, name, email, instrument, checked_in, checked_in_at, ticket_token, paid')
    .eq('event_id', ev.id).order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

module.exports = router;
