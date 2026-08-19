const router = require('express').Router();
const sb     = require('../lib/supabase');
const MOCK   = require('../lib/mock');
const { requireAuth } = require('../middleware/auth');

const pick = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));

const WORKFLOW_FIELDS = ['time', 'title', 'type', 'people', 'location'];

// ── Agenda pública ─────────────────────────────────────────────────────────────
router.get('/schedule', async (_req, res) => {
  if (!sb) return res.json(MOCK.schedule);
  const { data, error } = await sb.from('schedule_items').select('*').order('start_time');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Flujo de trabajo ───────────────────────────────────────────────────────────
router.get('/workflow', requireAuth, async (_req, res) => {
  if (!sb) return res.json(MOCK.workflow);
  const { data, error } = await sb.from('workflow_items').select('*').order('time');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/workflow', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const fields = pick(req.body, WORKFLOW_FIELDS);
  if (!fields.time || !fields.title)
    return res.status(400).json({ error: 'Se requieren time y title' });
  const { data, error } = await sb.from('workflow_items').insert(fields).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/workflow/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const updates = pick(req.body, WORKFLOW_FIELDS);
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Sin campos válidos' });
  const { data, error } = await sb.from('workflow_items')
    .update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/workflow/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { error } = await sb.from('workflow_items').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Maestros ───────────────────────────────────────────────────────────────────
router.get('/teachers', requireAuth, async (_req, res) => {
  if (!sb) return res.json(MOCK.teachers);
  const { data, error } = await sb.from('teachers').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/teachers', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const { name, role, schedule } = req.body;
  if (!name) return res.status(400).json({ error: 'Se requiere nombre' });
  const { data, error } = await sb.from('teachers').insert({ name, role, schedule }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/teachers/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { error } = await sb.from('teachers').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Alumnos ────────────────────────────────────────────────────────────────────
router.get('/students', requireAuth, async (_req, res) => {
  if (!sb) return res.json(MOCK.students);
  const { data, error } = await sb.from('students').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/students', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const { name, instrument, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Se requiere nombre' });
  const { data, error } = await sb.from('students').insert({ name, instrument, status: status ?? 'Activo' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/students/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { error } = await sb.from('students').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Horarios de alumnos ────────────────────────────────────────────────────────
router.get('/student-schedules', requireAuth, async (_req, res) => {
  if (!sb) return res.json(MOCK.studentSchedule);
  const { data, error } = await sb
    .from('student_schedules')
    .select('id, time_slot, room, students(name), teachers(name)')
    .order('time_slot');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Mensajes ───────────────────────────────────────────────────────────────────
router.get('/messages', requireAuth, async (_req, res) => {
  if (!sb) return res.json(MOCK.messages);
  const { data, error } = await sb.from('messages').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/messages/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { error } = await sb.from('messages').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Stats reales ───────────────────────────────────────────────────────────────
router.get('/stats', requireAuth, async (_req, res) => {
  if (!sb) return res.json({ events: 0, tickets: 0, classes: 0, messages: 0 });
  const [evR, tickR, classR, msgR] = await Promise.all([
    sb.from('events').select('*', { count: 'exact', head: true }),
    sb.from('registrations').select('*', { count: 'exact', head: true }).eq('paid', true),
    sb.from('workflow_items').select('*', { count: 'exact', head: true }),
    sb.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'Abierto'),
  ]);
  res.json({
    events:   evR.count    ?? 0,
    tickets:  tickR.count  ?? 0,
    classes:  classR.count ?? 0,
    messages: msgR.count   ?? 0,
  });
});

module.exports = router;
