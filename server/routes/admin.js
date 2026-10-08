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
  if (error) { console.error('[schedule] GET error:', error.message); return res.json([]); }
  res.json(data ?? []);
});

// ── Flujo de trabajo ───────────────────────────────────────────────────────────
router.get('/workflow', requireAuth, async (_req, res) => {
  if (!sb) return res.json(MOCK.workflow);
  const { data, error } = await sb.from('workflow_items').select('*').order('time');
  if (error) { console.error('[workflow] GET error:', error.message); return res.json([]); }
  res.json(data ?? []);
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
  if (error) { console.error('[teachers] GET error:', error.message); return res.json([]); }
  res.json(data ?? []);
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
  if (error) { console.error('[students] GET error:', error.message); return res.json([]); }
  res.json(data ?? []);
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

// ── Mis concursos (inscripciones del usuario autenticado) ─────────────────────
router.get('/my-contests', requireAuth, async (req, res) => {
  if (!sb) return res.json([]);
  const { data, error } = await sb
    .from('contest_enrollments')
    .select('id, status, piece, audition_date, score, place, contest_id, contests(id, name, category, location, date, results_date, deadline, judge)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) { console.error('[my-contests] GET error:', error.message); return res.json([]); }
  res.json(data ?? []);
});

// ── Concursos disponibles (todos, públicos) ────────────────────────────────────
router.get('/contests', requireAuth, async (_req, res) => {
  if (!sb) return res.json([]);
  const { data, error } = await sb
    .from('contests')
    .select('id, name, category, location, date, results_date, deadline, judge')
    .order('date', { ascending: true });
  if (error) { console.error('[contests] GET error:', error.message); return res.json([]); }
  res.json(data ?? []);
});

// ── Registraciones de todos los eventos del admin ─────────────────────────────
router.get('/registrations', requireAuth, async (req, res) => {
  if (!sb) return res.json([]);
  const { data: events } = await sb.from('events').select('id, title, slug').eq('user_id', req.user.id);
  if (!events?.length) return res.json([]);
  const eventIds = events.map(e => e.id);
  const { data, error } = await sb.from('registrations')
    .select('id, name, email, instrument, paid, checked_in, checked_in_at, ticket_token, created_at, event_id')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false });
  if (error) { console.error('[registrations] GET error:', error.message); return res.json([]); }
  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));
  res.json((data ?? []).map(r => ({ ...r, event: eventMap[r.event_id] })));
});

router.patch('/registrations/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const allowed = ['paid', 'checked_in'];
  const updates = pick(req.body, allowed);
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Sin campos válidos' });
  const { data: reg } = await sb.from('registrations').select('event_id').eq('id', req.params.id).single();
  if (!reg) return res.status(404).json({ error: 'No encontrado' });
  const { data: ev } = await sb.from('events').select('id').eq('id', reg.event_id).eq('user_id', req.user.id).single();
  if (!ev) return res.status(403).json({ error: 'No autorizado' });
  const { data, error } = await sb.from('registrations').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Horarios de alumnos ────────────────────────────────────────────────────────
router.get('/student-schedules', requireAuth, async (_req, res) => {
  if (!sb) return res.json(MOCK.studentSchedule);
  const { data, error } = await sb
    .from('student_schedules')
    .select('id, time_slot, room, student_id, teacher_id, students(id, name), teachers(id, name)')
    .order('time_slot');
  if (error) { console.error('[student-schedules] GET error:', error.message); return res.json([]); }
  res.json(data ?? []);
});

router.post('/student-schedules', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Sin Supabase' });
  const { student_id, teacher_id, time_slot, room } = req.body;
  if (!student_id || !time_slot) return res.status(400).json({ error: 'student_id y time_slot son requeridos' });
  const { data, error } = await sb.from('student_schedules')
    .insert({ student_id, teacher_id: teacher_id || null, time_slot, room: room || null })
    .select('id, time_slot, room, student_id, teacher_id, students(id, name), teachers(id, name)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/student-schedules/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { student_id, teacher_id, time_slot, room } = req.body;
  const updates = {};
  if (student_id  !== undefined) updates.student_id  = student_id;
  if (teacher_id  !== undefined) updates.teacher_id  = teacher_id || null;
  if (time_slot   !== undefined) updates.time_slot   = time_slot;
  if (room        !== undefined) updates.room        = room || null;
  const { data, error } = await sb.from('student_schedules')
    .update(updates).eq('id', req.params.id)
    .select('id, time_slot, room, student_id, teacher_id, students(id, name), teachers(id, name)')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/student-schedules/:id', requireAuth, async (req, res) => {
  if (!sb) return res.json({ ok: true });
  const { error } = await sb.from('student_schedules').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Mensajes ───────────────────────────────────────────────────────────────────
router.get('/messages', requireAuth, async (_req, res) => {
  if (!sb) return res.json(MOCK.messages);
  const { data, error } = await sb.from('messages').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[messages] GET error:', error.message); return res.json([]); }
  res.json(data ?? []);
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
    events:   evR.error   ? 0 : (evR.count    ?? 0),
    tickets:  tickR.error ? 0 : (tickR.count  ?? 0),
    classes:  classR.error? 0 : (classR.count ?? 0),
    messages: msgR.error  ? 0 : (msgR.count   ?? 0),
  });
});

module.exports = router;
