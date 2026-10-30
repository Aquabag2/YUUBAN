const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const sb        = require('../lib/supabase');
const { sendAuthEmail } = require('../lib/email');

// Sin RESEND_API_KEY se usan los correos propios de Supabase (diseño genérico, límite por hora)
const USE_RESEND = !!process.env.RESEND_API_KEY;

const APP_URL  = process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMMON_PASSWORDS = ['12345678', '123456789', '1234567890', 'password', 'contraseña', 'qwertyui', 'yuuban123', '11111111'];

// Máx. 5 correos por dirección cada hora: evita usar el formulario para bombardear a alguien
const perEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => String(req.body?.email ?? '').trim().toLowerCase() || 'sin-correo',
  message: { error: 'Ya enviamos varios correos a esta dirección. Revisa tu bandeja (y spam) o intenta en una hora.' },
});

const cleanEmail = (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    res.status(400).json({ error: 'Escribe un correo válido.' });
    return null;
  }
  return email;
};

// Ruta interna a la que vuelve el usuario tras abrir el enlace. Solo rutas relativas:
// un "next" externo convertiría nuestros correos en un redireccionador a sitios falsos.
const nextUrl = (req) => {
  const next = req.body?.next;
  const safe = typeof next === 'string' && /^\/(?![\/\\])[\w\-./?=&%]*$/.test(next) ? next : '/dashboard';
  return `${APP_URL}${safe}`;
};

// Mismo mensaje exista o no la cuenta: así no se puede averiguar quién está registrado
const SENT = { ok: true, message: 'Si el correo es válido, te llegará un enlace en unos segundos.' };

// Enlace para entrar sin contraseña. Si la cuenta no existe la crea (invite) y si no estaba
// confirmada, al abrirlo queda confirmada.
const sendAccessLink = async (email, redirectTo) => {
  if (!USE_RESEND) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    if (error) console.error('[auth] signInWithOtp:', error.message);
    return;
  }
  const options = { redirectTo };
  let { data, error } = await sb.auth.admin.generateLink({ type: 'magiclink', email, options });
  if (error) ({ data, error } = await sb.auth.admin.generateLink({ type: 'invite', email, options }));
  if (error) { console.error('[auth] generateLink:', error.message); return; }
  await sendAuthEmail({ to: email, type: 'magiclink', link: data.properties.action_link });
};

// ── Crear cuenta con correo y contraseña ──────────────────────────────────────
router.post('/signup', perEmailLimiter, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'Registro no disponible' });
  const email = cleanEmail(req, res);
  if (!email) return;

  const { password } = req.body;
  if (typeof password !== 'string' || password.length < 8)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  if (password.length > 72)
    return res.status(400).json({ error: 'La contraseña es demasiado larga (máx. 72 caracteres).' });
  if (COMMON_PASSWORDS.includes(password.toLowerCase()) || /^(.)\1+$/.test(password))
    return res.status(400).json({ error: 'Esa contraseña es muy fácil de adivinar. Prueba con otra.' });

  if (!USE_RESEND) {
    const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: nextUrl(req) } });
    if (error && !/already|registered|exists/i.test(error.message)) {
      console.error('[auth] signUp:', error.message);
      return res.status(400).json({ error: 'No pudimos crear la cuenta. Intenta de nuevo.' });
    }
    return res.json(SENT);
  }

  const { data, error } = await sb.auth.admin.generateLink({
    type: 'signup', email, password,
    options: { redirectTo: nextUrl(req) },
  });

  if (error) {
    // Ya existe: le mandamos un enlace de acceso (que también confirma su correo)
    if (/already|registered|exists/i.test(error.message)) {
      await sendAccessLink(email, nextUrl(req));
      return res.json(SENT);
    }
    console.error('[auth] signup:', error.message);
    return res.status(400).json({ error: 'No pudimos crear la cuenta. Intenta de nuevo.' });
  }

  await sendAuthEmail({ to: email, type: 'signup', link: data.properties.action_link });
  res.json(SENT);
});

// ── Enlace mágico / reenviar confirmación ─────────────────────────────────────
router.post('/magic-link', perEmailLimiter, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'No disponible' });
  const email = cleanEmail(req, res);
  if (!email) return;
  await sendAccessLink(email, nextUrl(req));
  res.json(SENT);
});

// ── Olvidé mi contraseña ──────────────────────────────────────────────────────
router.post('/forgot', perEmailLimiter, async (req, res) => {
  if (!sb) return res.status(503).json({ error: 'No disponible' });
  const email = cleanEmail(req, res);
  if (!email) return;

  if (!USE_RESEND) {
    await sb.auth.resetPasswordForEmail(email, { redirectTo: `${APP_URL}/reset-password` });
    return res.json(SENT);
  }

  const { data, error } = await sb.auth.admin.generateLink({
    type: 'recovery', email,
    options: { redirectTo: `${APP_URL}/reset-password` },
  });
  if (!error) await sendAuthEmail({ to: email, type: 'recovery', link: data.properties.action_link });
  res.json(SENT);
});

module.exports = router;
