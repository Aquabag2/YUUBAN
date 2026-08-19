const router = require('express').Router();
const sb     = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// ── Ver ticket por token ───────────────────────────────────────────────────────
router.get('/:token', async (req, res) => {
  if (!sb) {
    return res.json({
      name: 'Demo', email: 'demo@yuuban.com', instrument: 'Piano',
      checked_in: false, ticket_token: req.params.token,
      events: { title: 'Festival Yuuban 2026', date: '12–14 Marzo 2026', location: 'Auditorio', slug: 'festival-yuuban-2026' },
    });
  }
  const { data, error } = await sb
    .from('registrations')
    .select('id, name, email, instrument, checked_in, checked_in_at, ticket_token, paid, events(title, date, location, slug, cover_color)')
    .eq('ticket_token', req.params.token)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Ticket no encontrado' });
  res.json(data);
});

// ── Marcar entrada (staff autenticado) ────────────────────────────────────────
router.post('/:token/checkin', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true, name: 'Demo', checked_in: true });
  const { data, error } = await sb
    .from('registrations')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('ticket_token', req.params.token)
    .select('id, name, email, instrument, checked_in')
    .single();
  if (error || !data) return res.status(404).json({ error: 'Ticket no encontrado' });
  res.json({ ok: true, ...data });
});

module.exports = router;
