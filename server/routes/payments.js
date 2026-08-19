const router = require('express').Router();
const sb     = require('../lib/supabase');
const { sendTicketEmail } = require('../lib/email');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// ── Crear sesión de pago Stripe Checkout ───────────────────────────────────────
router.post('/e/:slug/checkout', async (req, res) => {
  const { name, email, instrument, notes } = req.body;

  if (!name?.trim() || !email?.trim())
    return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Correo no válido' });

  if (!sb)
    return res.json({ url: `/e/${req.params.slug}?payment=demo&session_id=demo123` });

  const { data: ev } = await sb.from('events')
    .select('id, title, price_cents, is_published')
    .eq('slug', req.params.slug).eq('is_published', true).single();

  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
  if (!ev.price_cents || ev.price_cents <= 0)
    return res.status(400).json({ error: 'Este evento es gratuito' });

  const cleanEmail = email.trim().toLowerCase();

  const { data: existing } = await sb.from('registrations')
    .select('id, ticket_token').eq('event_id', ev.id).eq('email', cleanEmail).single();
  if (existing)
    return res.status(409).json({ error: 'Este correo ya está registrado', ticket_url: `/ticket/${existing.ticket_token}` });

  if (!stripe) {
    const { data: reg } = await sb.from('registrations').insert({
      event_id: ev.id, name: name.trim(), email: cleanEmail,
      instrument: instrument?.trim() || null, notes: notes?.trim() || null, paid: false,
    }).select('ticket_token').single();
    return res.json({ url: `/ticket/${reg?.ticket_token}?demo=1` });
  }

  const origin = req.headers.origin || process.env.CORS_ORIGIN || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: cleanEmail,
    line_items: [{ price_data: {
      currency: 'mxn',
      unit_amount: ev.price_cents,
      product_data: { name: `Inscripción — ${ev.title}` },
    }, quantity: 1 }],
    metadata: {
      event_id: String(ev.id), event_slug: req.params.slug,
      attendee_name: name.trim(), attendee_email: cleanEmail,
      instrument: instrument?.trim() || '', notes: notes?.trim() || '',
    },
    success_url: `${origin}/e/${req.params.slug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/e/${req.params.slug}?payment=cancelled`,
  });

  res.json({ url: session.url });
});

// ── Confirmar pago y crear registro (idempotente) ─────────────────────────────
router.post('/e/:slug/confirm-payment', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id requerido' });
  if (!sb) return res.json({ ok: true, ticket_url: '/ticket/demo-token' });
  if (!stripe) return res.status(503).json({ error: 'Stripe no configurado' });

  let session;
  try { session = await stripe.checkout.sessions.retrieve(session_id); }
  catch { return res.status(400).json({ error: 'Sesión de pago no válida' }); }

  if (session.payment_status !== 'paid')
    return res.status(402).json({ error: 'El pago no fue completado' });

  const { event_id, attendee_name, attendee_email, instrument, notes } = session.metadata;

  const { data: existing } = await sb.from('registrations')
    .select('ticket_token').eq('event_id', event_id).eq('email', attendee_email).single();
  if (existing) return res.json({ ok: true, ticket_url: `/ticket/${existing.ticket_token}` });

  const { data: ev } = await sb.from('events')
    .select('title, date, location, price_cents').eq('id', parseInt(event_id)).single();

  const { data: reg, error } = await sb.from('registrations').insert({
    event_id: parseInt(event_id),
    name: attendee_name, email: attendee_email,
    instrument: instrument || null, notes: notes || null,
    paid: true, stripe_session_id: session_id,
  }).select('ticket_token').single();

  if (error) return res.status(500).json({ error: error.message });

  const ticketUrl = `/ticket/${reg.ticket_token}`;
  sendTicketEmail({
    to: attendee_email, name: attendee_name,
    eventTitle: ev?.title ?? 'Evento', eventDate: ev?.date, eventLocation: ev?.location,
    ticketUrl, paid: true, priceCents: ev?.price_cents ?? 0,
  }).catch(() => {});

  res.json({ ok: true, ticket_url: ticketUrl });
});

module.exports = router;
