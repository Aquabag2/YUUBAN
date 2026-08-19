const router  = require('express').Router();
const sb       = require('../lib/supabase');
const MOCK     = require('../lib/mock');
const { requireAuth } = require('../middleware/auth');
const { sendTicketEmail } = require('../lib/email');

const pick = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));

const EVENT_FIELDS = ['title', 'location', 'date', 'summary', 'slug', 'cover_color', 'is_published', 'price_cents'];

// ── Todos los eventos publicados ───────────────────────────────────────────────
router.get('/events/published', async (_req, res) => {
  if (!sb) return res.json([MOCK.event]);
  const { data, error } = await sb
    .from('events')
    .select('id, title, location, date, summary, slug, cover_color, price_cents')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ── Primer evento (ruta legada) ───────────────────────────────────────────────
router.get('/event', async (_req, res) => {
  if (!sb) return res.json(MOCK.event);
  const { data, error } = await sb.from('events').select('*').limit(1).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Evento del admin — GET / POST / PUT ───────────────────────────────────────
router.get('/my-event', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ...MOCK.event, slug: 'demo-event' });
  const { data } = await sb.from('events').select('*').eq('admin_id', req.user.id).maybeSingle();
  res.json(data ?? null);
});

router.post('/my-event', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const fields = pick(req.body, EVENT_FIELDS);
  if (!fields.title) return res.status(400).json({ error: 'El título es obligatorio' });
  if (!fields.slug)
    fields.slug = fields.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 60);
  const { data, error } = await sb.from('events')
    .insert({ ...fields, admin_id: req.user.id }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/my-event/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const fields = pick(req.body, EVENT_FIELDS);
  if (fields.price_cents !== undefined) fields.price_cents = parseInt(fields.price_cents) || 0;
  const { data, error } = await sb.from('events')
    .update(fields).eq('id', req.params.id).eq('admin_id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Inscritos del evento del admin ────────────────────────────────────────────
router.get('/my-event/:id/registrations', requireAuth, async (req, res) => {
  if (!sb) return res.json([]);
  const { data: ev } = await sb.from('events')
    .select('id').eq('id', req.params.id).eq('admin_id', req.user.id).single();
  if (!ev) return res.status(403).json({ error: 'No autorizado' });
  const { data, error } = await sb.from('registrations')
    .select('*').eq('event_id', req.params.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ── Página pública del evento ─────────────────────────────────────────────────
router.get('/e/:slug', async (req, res) => {
  if (!sb) return res.json({ ...MOCK.event, slug: req.params.slug, is_published: true });
  const { data, error } = await sb
    .from('events')
    .select('id, title, location, date, summary, slug, cover_color, is_published, price_cents')
    .eq('slug', req.params.slug).eq('is_published', true).single();
  if (error || !data) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json(data);
});

// ── Agenda pública del evento ─────────────────────────────────────────────────
router.get('/e/:slug/schedule', async (req, res) => {
  if (!sb) return res.json(MOCK.schedule);
  const { data: ev } = await sb.from('events').select('id').eq('slug', req.params.slug).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  const { data, error } = await sb
    .from('schedule_items').select('*').eq('event_id', ev.id).order('start_time');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ── Inscripción pública (evento gratuito) ─────────────────────────────────────
router.post('/e/:slug/register', async (req, res) => {
  if (!sb) return res.json({ ok: true, message: 'Demo', ticket_token: 'demo-token', ticket_url: '/ticket/demo-token' });

  const { name, email, instrument, notes } = req.body;
  if (!name?.trim() || !email?.trim())
    return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Correo no válido' });

  const { data: ev } = await sb.from('events')
    .select('id, title, date, location, price_cents').eq('slug', req.params.slug).eq('is_published', true).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  if (ev.price_cents > 0)
    return res.status(400).json({ error: 'Este evento requiere pago. Usa el flujo de pago.' });

  const { data: existing } = await sb.from('registrations')
    .select('id').eq('event_id', ev.id).eq('email', email.trim().toLowerCase()).single();
  if (existing) return res.status(409).json({ error: 'Este correo ya está registrado' });

  const { data: reg, error } = await sb.from('registrations').insert({
    event_id: ev.id, name: name.trim(),
    email: email.trim().toLowerCase(),
    instrument: instrument?.trim() || null,
    notes: notes?.trim() || null,
  }).select('id, ticket_token').single();

  if (error) return res.status(500).json({ error: error.message });

  const ticketUrl = `/ticket/${reg.ticket_token}`;
  sendTicketEmail({
    to: email.trim().toLowerCase(), name: name.trim(),
    eventTitle: ev.title ?? 'Evento', eventDate: ev.date, eventLocation: ev.location,
    ticketUrl, paid: false, priceCents: 0,
  }).catch(() => {});

  res.json({ ok: true, message: '¡Registro exitoso!', ticket_token: reg.ticket_token, ticket_url: ticketUrl });
});

// ── Lista de asistentes (staff autenticado) ───────────────────────────────────
router.get('/e/:slug/attendees', requireAuth, async (req, res) => {
  if (!sb) return res.json([]);
  const { data: ev } = await sb.from('events').select('id').eq('slug', req.params.slug).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  const { data, error } = await sb
    .from('registrations')
    .select('id, name, email, instrument, checked_in, checked_in_at, ticket_token, paid')
    .eq('event_id', ev.id).order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

module.exports = router;
