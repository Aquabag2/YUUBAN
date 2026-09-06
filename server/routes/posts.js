const router = require('express').Router();
const sb     = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

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
    .select('id, type, title, content, is_pinned, created_at, events(title, slug)')
    .in('event_id', eventIds)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ── POST crear post (admin) ───────────────────────────────────────────────────
router.post('/e/:slug/posts', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });

  const { title, content, type, is_pinned } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });

  const validTypes = ['announcement', 'schedule', 'result', 'winner'];
  if (type && !validTypes.includes(type))
    return res.status(400).json({ error: 'Tipo inválido' });

  const { data: ev } = await sb.from('events').select('id, user_id').eq('slug', req.params.slug).single();
  if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });

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
router.put('/posts/:id', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });

  const { title, content, type, is_pinned } = req.body;

  const { data: post } = await sb.from('posts').select('author_id').eq('id', req.params.id).single();
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

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
router.delete('/posts/:id', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });
  const { error } = await sb.from('posts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
