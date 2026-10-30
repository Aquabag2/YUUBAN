const router = require('express').Router();
const sb     = require('../lib/supabase');
const { requireAdmin, canManageEvent } = require('../middleware/auth');
const { PAYMENTS_ENABLED } = require('../lib/registration');

// ── Ver ticket por token ───────────────────────────────────────────────────────
router.get('/:token', async (req, res) => {
  if (!sb) {
    return res.json({
      name: 'Demo', email: 'demo@yuuban.com', instrument: 'Piano',
      checked_in: false, ticket_token: req.params.token,
      events: { title: 'Festival Yuuban 2026', date: '12–14 Marzo 2026', location: 'Auditorio', slug: 'festival-yuuban-2026' },
    });
  }
  const COLS = 'id, name, email, instrument, checked_in, checked_in_at, ticket_token, paid, events(title, date, location, slug, cover_color)';
  const find = (cols) => sb.from('registrations').select(cols).eq('ticket_token', req.params.token).maybeSingle();
  // certificate_url existe solo si se corrió certificate_templates.sql
  let { data, error } = await find(`${COLS}, certificate_url`);
  if (error) ({ data, error } = await find(COLS));
  if (error || !data) return res.status(404).json({ error: 'Ticket no encontrado' });

  // Quien tenga el enlace ve el boleto, pero no el correo completo ni rutas internas
  const { certificate_url, email, ...rest } = data;
  const [user, domain] = String(email ?? '').split('@');
  res.json({
    ...rest,
    email: user && domain ? `${user.slice(0, 2)}${'•'.repeat(Math.max(user.length - 2, 1))}@${domain}` : null,
    has_certificate: !!certificate_url,
  });
});

// ── Marcar entrada (staff autenticado) ────────────────────────────────────────
router.post('/:token/checkin', requireAdmin, async (req, res) => {
  if (!sb) return res.json({ ok: true, name: 'Demo', checked_in: true });

  // Soporta QR diario: token puede venir como "tickettoken|YYYY-MM-DD"
  const rawToken = req.params.token;
  const [ticketToken, qrDate] = rawToken.includes('|') ? rawToken.split('|') : [rawToken, null];

  // Si trae fecha del QR diario, validar que sea de hoy
  if (qrDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (qrDate !== today)
      return res.status(400).json({ error: `QR expirado. Este código era válido para ${qrDate}. Pide al asistente que genere el QR de hoy.` });
  }

  const { data: reg } = await sb
    .from('registrations')
    .select('id, event_id, name, email, instrument, checked_in, checked_in_at, paid, events(title, price_cents)')
    .eq('ticket_token', ticketToken)
    .single();

  if (!reg) return res.status(404).json({ error: 'Ticket no encontrado o no válido para este evento.' });
  if (!(await canManageEvent(req, reg.event_id)))
    return res.status(403).json({ error: 'Este boleto es de un evento que no administras.' });

  // Bloquear si no pagó y el evento tiene costo
  if (PAYMENTS_ENABLED && reg.events?.price_cents > 0 && !reg.paid)
    return res.status(402).json({
      error: 'Pago pendiente',
      detail: `${reg.name} aún no ha completado su pago. No puede ingresar.`,
      name: reg.name,
      paid: false,
    });

  if (reg.checked_in)
    return res.json({ ok: true, already: true, ...reg });

  const { data, error } = await sb
    .from('registrations')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', reg.id)
    .select('id, name, email, instrument, checked_in, checked_in_at, paid')
    .single();

  if (error || !data) return res.status(500).json({ error: 'Error al marcar entrada.' });
  res.json({ ok: true, already: false, ...data });
});

module.exports = router;
