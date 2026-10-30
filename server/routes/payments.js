const router = require('express').Router();
const sb     = require('../lib/supabase');
const { sendTicketEmail } = require('../lib/email');
const { PAYMENTS_ENABLED, validateAttendee, resolveTicketType } = require('../lib/registration');
const { requireAuth, requireAdmin, canManageEvent } = require('../middleware/auth');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// Crea la inscripción de una sesión pagada. Idempotente: el webhook y la página
// de éxito pueden llegar al mismo tiempo, y la BD tiene índice único en stripe_session_id.
const fulfillCheckout = async (session) => {
  const findBySession = () => sb.from('registrations')
    .select('ticket_token').eq('stripe_session_id', session.id).maybeSingle();

  const { data: done } = await findBySession();
  if (done) return `/ticket/${done.ticket_token}`;

  const { event_id, attendee_name, attendee_email, instrument, notes, ticket_type_id, ticket_type_name } = session.metadata;
  const eventId = parseInt(event_id);

  // Ya inscrito con ese correo (p. ej. pagó dos veces): no duplicar el boleto
  const { data: existing } = await sb.from('registrations')
    .select('id, ticket_token, paid').eq('event_id', eventId).eq('email', attendee_email).maybeSingle();
  if (existing) {
    if (!existing.paid)
      await sb.from('registrations').update({ paid: true, stripe_session_id: session.id }).eq('id', existing.id);
    else console.warn(`[stripe] Pago duplicado ${session.id} para ${attendee_email} — revisar reembolso`);
    return `/ticket/${existing.ticket_token}`;
  }

  const { data: reg, error } = await sb.from('registrations').insert({
    event_id: eventId,
    name: attendee_name, email: attendee_email,
    instrument: instrument || null, notes: notes || null,
    paid: true, stripe_session_id: session.id,
    ticket_type_id: ticket_type_id ? parseInt(ticket_type_id) : null,
    ticket_type_name: ticket_type_name || null,
  }).select('ticket_token').single();

  if (error?.code === '23505') {
    const { data: again } = await findBySession();
    if (again) return `/ticket/${again.ticket_token}`;
  }
  if (error) throw new Error(error.message);

  const ticketUrl = `/ticket/${reg.ticket_token}`;
  const { data: ev } = await sb.from('events').select('title, date, location').eq('id', eventId).single();
  sendTicketEmail({
    to: attendee_email, name: attendee_name,
    eventTitle: ev?.title ?? 'Evento', eventDate: ev?.date, eventLocation: ev?.location,
    ticketUrl, paid: true, priceCents: session.amount_total ?? 0,
  }).catch(() => {});

  return ticketUrl;
};

// ── Webhook de Stripe ─────────────────────────────────────────────────────────
// Se monta en index.js ANTES de express.json(): la firma se valida contra el body crudo.
const webhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET)
    return res.status(503).json({ error: 'Webhook no configurado' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe] Firma de webhook inválida:', err.message);
    return res.status(400).json({ error: 'Firma inválida' });
  }

  const session = event.data.object;
  const paidNow = (event.type === 'checkout.session.completed' && session.payment_status === 'paid')
    || event.type === 'checkout.session.async_payment_succeeded';

  if (paidNow && sb) {
    try { await fulfillCheckout(session); }
    catch (err) {
      console.error('[stripe] Error al registrar pago:', err.message);
      return res.status(500).json({ error: 'Reintentar' }); // Stripe reintenta automáticamente
    }
  }
  res.json({ received: true });
};

// ── Crear sesión de pago Stripe Checkout ───────────────────────────────────────
router.post('/e/:slug/checkout', requireAuth, async (req, res) => {
  const { name, instrument, notes, ticket_type_id } = req.body;
  const email = req.user.email; // correo de la cuenta, no el del formulario

  const invalid = validateAttendee({ ...req.body, email });
  if (invalid) return res.status(400).json({ error: invalid });

  if (!PAYMENTS_ENABLED)
    return res.status(400).json({ error: 'Por ahora la inscripción es gratuita: usa el registro directo.' });

  if (!sb)
    return res.json({ url: `/e/${req.params.slug}?payment=demo&session_id=demo123` });

  const { data: ev } = await sb.from('events')
    .select('id, title, price_cents, is_published')
    .eq('slug', req.params.slug).eq('is_published', true).single();

  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });

  // Precio SIEMPRE calculado en el servidor, nunca el que mande el navegador
  const plan = await resolveTicketType(ev, ticket_type_id);
  if (plan.error) return res.status(plan.status).json({ error: plan.error });
  const { effectivePrice, ticketTypeName, productName } = plan;

  if (effectivePrice <= 0)
    return res.status(400).json({ error: 'Este plan es gratuito, usa el registro directo.' });

  const cleanEmail = email.trim().toLowerCase();

  const { data: existing } = await sb.from('registrations')
    .select('id, ticket_token').eq('event_id', ev.id).eq('email', cleanEmail).maybeSingle();
  if (existing)
    return res.status(409).json({ error: 'Este correo ya está registrado', ticket_url: `/ticket/${existing.ticket_token}` });

  if (!stripe) {
    if (process.env.NODE_ENV === 'production')
      return res.status(503).json({ error: 'Los pagos no están disponibles en este momento.' });
    const { data: reg } = await sb.from('registrations').insert({
      event_id: ev.id, name: name.trim(), email: cleanEmail,
      instrument: instrument?.trim() || null, notes: notes?.trim() || null,
      paid: false, ticket_type_id: ticket_type_id || null, ticket_type_name: ticketTypeName,
    }).select('ticket_token').single();
    return res.json({ url: `/ticket/${reg?.ticket_token}?demo=1` });
  }

  // Origen fijo del servidor: no confiar en la cabecera Origin para las URLs de regreso
  const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: cleanEmail,
      locale: 'es',
      line_items: [{ price_data: {
        currency: 'mxn',
        unit_amount: effectivePrice,
        product_data: { name: productName },
      }, quantity: 1 }],
      metadata: {
        event_id: String(ev.id), event_slug: req.params.slug,
        attendee_name: name.trim(), attendee_email: cleanEmail,
        instrument: instrument?.trim() || '', notes: notes?.trim().slice(0, 450) || '',
        ticket_type_id: ticket_type_id ? String(ticket_type_id) : '',
        ticket_type_name: ticketTypeName || '',
      },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hora para pagar
      success_url: `${origin}/e/${req.params.slug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/e/${req.params.slug}?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] Error al crear sesión:', err.message);
    res.status(502).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });
  }
});

// ── Confirmar pago desde la página de éxito (el webhook es la fuente principal) ─
router.post('/e/:slug/confirm-payment', requireAuth, async (req, res) => {
  const { session_id } = req.body;
  if (typeof session_id !== 'string' || !session_id.startsWith('cs_'))
    return res.status(400).json({ error: 'session_id requerido' });
  if (!sb) return res.json({ ok: true, ticket_url: '/ticket/demo-token' });
  if (!stripe) return res.status(503).json({ error: 'Stripe no configurado' });

  let session;
  try { session = await stripe.checkout.sessions.retrieve(session_id); }
  catch { return res.status(400).json({ error: 'Sesión de pago no válida' }); }

  if (session.metadata?.event_slug !== req.params.slug)
    return res.status(400).json({ error: 'Sesión de pago no válida' });
  if (session.payment_status !== 'paid')
    return res.status(402).json({ error: 'Tu pago aún se está procesando. Te enviaremos tu boleto por correo.' });

  try {
    const ticketUrl = await fulfillCheckout(session);
    res.json({ ok: true, ticket_url: ticketUrl });
  } catch (err) {
    console.error('[stripe] confirm-payment:', err.message);
    res.status(500).json({ error: 'No se pudo confirmar tu pago. Si se cobró, te llegará el boleto por correo.' });
  }
});

// ── Detalle del pago de un inscrito (para el dueño del evento) ────────────────
router.get('/my-event/:id/registrations/:regId/payment', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ has_payment: false });
  if (!(await canManageEvent(req, req.params.id))) return res.status(403).json({ error: 'No autorizado' });

  const { data: reg } = await sb.from('registrations')
    .select('id, paid, stripe_session_id').eq('id', req.params.regId).eq('event_id', req.params.id).maybeSingle();
  if (!reg) return res.status(404).json({ error: 'Inscripción no encontrada' });
  if (!reg.stripe_session_id) return res.json({ has_payment: false, paid: !!reg.paid });
  if (!stripe) return res.json({ has_payment: true, session_id: reg.stripe_session_id, stripe_unavailable: true });

  try {
    const s = await stripe.checkout.sessions.retrieve(reg.stripe_session_id, { expand: ['payment_intent.latest_charge'] });
    const pi = typeof s.payment_intent === 'object' ? s.payment_intent : null;
    const charge = pi && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
    const card = charge?.payment_method_details?.card;
    res.json({
      has_payment: true,
      session_id: s.id,
      status: s.payment_status,
      amount_cents: s.amount_total,
      currency: s.currency,
      created: s.created,
      email: s.customer_details?.email ?? s.customer_email,
      card: card ? { brand: card.brand, last4: card.last4 } : null,
      receipt_url: charge?.receipt_url ?? null,
      refunded_cents: charge?.amount_refunded ?? 0,
      dashboard_url: pi ? `https://dashboard.stripe.com/${s.livemode ? '' : 'test/'}payments/${pi.id}` : null,
    });
  } catch (err) {
    console.error('[stripe] No se pudo leer la sesión:', err.message);
    res.status(502).json({ error: 'Stripe no respondió' });
  }
});

module.exports = router;
module.exports.webhook = webhook;
