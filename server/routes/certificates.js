const router  = require('express').Router();
const sb       = require('../lib/supabase');
const PDFDoc   = require('pdfkit');
const multer   = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máx
  fileFilter: (_req, file, cb) => {
    if (['image/png', 'image/jpeg', 'application/pdf'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes PNG, JPG o PDF'));
  },
});

// ── GET /api/certificates/templates ───────────────────────────────────────────
// Lista templates de la plataforma + los del cliente autenticado
router.get('/certificates/templates', requireAuth, async (req, res) => {
  if (!sb) return res.json([]);
  const { data, error } = await sb
    .from('certificate_templates')
    .select('id, name, image_url, fields, is_platform, created_by, created_at')
    .or(`is_platform.eq.true,created_by.eq.${req.user.id}`)
    .order('is_platform', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── POST /api/certificates/templates ──────────────────────────────────────────
// Sube un nuevo template (imagen PNG/JPG o PDF)
router.post('/certificates/templates', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });
  if (!req.body.name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });

  const ext  = req.file.mimetype === 'application/pdf' ? 'pdf' : 'png';
  const path = `${req.user.id}/${Date.now()}.${ext}`;

  const { error: upErr } = await sb.storage
    .from('certificate-templates')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data: { publicUrl } } = sb.storage
    .from('certificate-templates')
    .getPublicUrl(path);

  const fields = req.body.fields ? JSON.parse(req.body.fields) : defaultFields();

  const { data, error } = await sb
    .from('certificate_templates')
    .insert({ name: req.body.name.trim(), image_url: publicUrl, fields, created_by: req.user.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── PUT /api/certificates/templates/:id/fields ────────────────────────────────
// Guarda posiciones de campos del editor visual
router.put('/certificates/templates/:id/fields', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });
  const { fields } = req.body;
  if (!Array.isArray(fields)) return res.status(400).json({ error: 'fields debe ser array' });

  const { data: tpl } = await sb
    .from('certificate_templates')
    .select('created_by')
    .eq('id', req.params.id)
    .single();

  if (!tpl) return res.status(404).json({ error: 'Template no encontrado' });
  if (tpl.created_by !== req.user.id && req.user.role !== 'super_admin')
    return res.status(403).json({ error: 'Sin permiso' });

  const { error } = await sb
    .from('certificate_templates')
    .update({ fields })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── POST /api/certificates/event/:event_id/assign ─────────────────────────────
// Asigna un template a un evento y activa constancias
router.post('/certificates/event/:event_id/assign', requireAdmin, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });
  const { template_id } = req.body;

  const { error } = await sb
    .from('events')
    .update({ certificate_template_id: template_id, certificates_enabled: true })
    .eq('id', req.params.event_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── POST /api/certificates/generate/:registration_id ─────────────────────────
// Genera el PDF de constancia para un inscrito
router.post('/certificates/generate/:registration_id', requireAuth, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });

  const { data: reg } = await sb
    .from('registrations')
    .select('id, name, email, certificate_url, event:events(id, title, date, certificate_template_id, certificates_enabled)')
    .eq('id', req.params.registration_id)
    .single();

  if (!reg) return res.status(404).json({ error: 'Inscripción no encontrada' });
  if (!reg.event?.certificates_enabled)
    return res.status(400).json({ error: 'Las constancias no están activadas para este evento' });
  if (reg.certificate_url)
    return res.json({ ok: true, url: reg.certificate_url }); // ya generada

  const { data: tpl } = await sb
    .from('certificate_templates')
    .select('*')
    .eq('id', reg.event.certificate_template_id)
    .single();

  if (!tpl) return res.status(400).json({ error: 'Template no configurado' });

  // Descargar la imagen del template
  let imgBuffer;
  try {
    const resp = await fetch(tpl.image_url);
    imgBuffer = Buffer.from(await resp.arrayBuffer());
  } catch {
    return res.status(500).json({ error: 'No se pudo cargar la imagen del template' });
  }

  // Generar PDF
  const pdfBuffer = await generateCertificatePDF({
    imageBuffer: imgBuffer,
    fields: tpl.fields,
    data: {
      name:  reg.name,
      event: reg.event.title,
      date:  reg.event.date
        ? new Date(reg.event.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
        : '',
    },
  });

  // Subir PDF a Supabase Storage
  const path = `generated/${reg.id}.pdf`;
  const { error: upErr } = await sb.storage
    .from('certificates')
    .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });

  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data: { publicUrl } } = sb.storage.from('certificates').getPublicUrl(path);

  await sb.from('registrations').update({ certificate_url: publicUrl }).eq('id', reg.id);

  res.json({ ok: true, url: publicUrl });
});

// ── GET /api/certificates/download/:token ─────────────────────────────────────
// El alumno descarga su constancia desde su ticket (sin auth)
router.get('/certificates/download/:token', async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Supabase no configurado' });

  const { data: reg } = await sb
    .from('registrations')
    .select('certificate_url, name')
    .eq('ticket_token', req.params.token)
    .single();

  if (!reg) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (!reg.certificate_url) return res.status(404).json({ error: 'Constancia no generada aún' });

  res.redirect(reg.certificate_url);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultFields() {
  return [
    { key: 'name',  label: 'Nombre',  x: 0.5, y: 0.5,  fontSize: 36, color: '#1a1a1a', align: 'center', fontWeight: 'bold' },
    { key: 'event', label: 'Evento',  x: 0.5, y: 0.62, fontSize: 22, color: '#4B5563', align: 'center', fontWeight: 'normal' },
    { key: 'date',  label: 'Fecha',   x: 0.5, y: 0.72, fontSize: 18, color: '#6B7280', align: 'center', fontWeight: 'normal' },
  ];
}

function generateCertificatePDF({ imageBuffer, fields, data }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDoc({ size: 'A4', layout: 'landscape', margin: 0 });

    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    // Imagen de fondo
    try {
      doc.image(imageBuffer, 0, 0, { width: W, height: H });
    } catch {
      doc.rect(0, 0, W, H).fill('#ffffff');
    }

    // Campos de texto
    for (const field of fields) {
      const value = data[field.key];
      if (!value) continue;

      doc.font(field.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(field.fontSize || 24)
         .fillColor(field.color || '#000000');

      const x = field.align === 'center' ? 0 : field.x * W;
      const y = field.y * H;

      if (field.align === 'center') {
        doc.text(value, 0, y, { width: W, align: 'center' });
      } else {
        doc.text(value, x, y);
      }
    }

    doc.end();
  });
}

module.exports = router;
