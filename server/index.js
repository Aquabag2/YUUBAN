require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const eventsRouter   = require('./routes/events');
const ticketsRouter  = require('./routes/tickets');
const adminRouter    = require('./routes/admin');
const superRouter    = require('./routes/super');
const paymentsRouter      = require('./routes/payments');
const certificatesRouter  = require('./routes/certificates');
const postsRouter         = require('./routes/posts');

const app  = express();
const PORT = process.env.PORT || 8000;

// ── Seguridad ─────────────────────────────────────────────────────────────────

// Cabeceras de seguridad HTTP (previene XSS, clickjacking, sniffing, etc.)
app.use(helmet());

// CORS estricto: solo acepta peticiones del frontend oficial
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting general: máx. 100 peticiones por IP cada 15 minutos
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
  skip: (req) => req.path === '/health', // el health check no cuenta
}));

// Rate limiting más estricto para login/registro (previene fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Intenta en 15 minutos.' },
});
app.use('/api/e/:slug/checkout',  authLimiter);
app.use('/api/e/:slug/register',  authLimiter);

app.use(express.json({ limit: '1mb' })); // limita tamaño del body

// Logger solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });
}

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, name: 'yuuban-server' }));

// Diagnóstico completo de auth
app.get('/health/auth', async (req, res) => {
  const sb = require('./lib/supabase');
  const token = req.headers.authorization?.split(' ')[1];

  const info = {
    supabase_url_set:     !!process.env.SUPABASE_URL,
    service_key_set:      !!process.env.SUPABASE_SERVICE_KEY,
    jwt_secret_set:       !!process.env.SUPABASE_JWT_SECRET,
    supabase_url_preview: process.env.SUPABASE_URL?.slice(0, 40) ?? null,
    supabase_client:      sb ? 'ok' : 'no inicializado',
  };

  if (!token) return res.json({ ...info, token: 'no enviado' });

  // Decodifica sin verificar para ver si el payload es legible
  let decoded = null;
  try {
    const jwt = require('jsonwebtoken');
    decoded = jwt.decode(token);
  } catch {}

  // Intenta getUser con service key
  let supabaseResult = null;
  if (sb) {
    const { data, error } = await sb.auth.getUser(token);
    supabaseResult = { ok: !error && !!data?.user, error: error?.message ?? null, email: data?.user?.email ?? null };
  }

  // Intenta verificar con JWT secret
  let jwtResult = null;
  if (process.env.SUPABASE_JWT_SECRET) {
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, { algorithms: ['HS256'] });
      jwtResult = { ok: true, sub: payload.sub, email: payload.email };
    } catch (e) {
      jwtResult = { ok: false, error: e.message };
    }
  }

  res.json({
    ...info,
    token_prefix: token.slice(0, 30) + '...',
    token_decoded_sub: decoded?.sub ?? null,
    token_exp: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null,
    token_expired: decoded?.exp ? decoded.exp < Date.now() / 1000 : null,
    supabase_getUser: supabaseResult,
    jwt_secret_verify: jwtResult,
  });
});

app.use('/api',         eventsRouter);
app.use('/api/ticket',  ticketsRouter);
app.use('/api',         adminRouter);
app.use('/api/super',   superRouter);
app.use('/api',         paymentsRouter);
app.use('/api',         certificatesRouter);
app.use('/api',         postsRouter);

// ── 404 y errores globales ────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Inicio ────────────────────────────────────────────────────────────────────
const sb = require('./lib/supabase');

app.listen(PORT, () => {
  console.log(`Yuuban server en puerto ${PORT} (${process.env.NODE_ENV || 'development'})`);
  if (!sb)                              console.log('⚠  Supabase no configurado — modo demo');
  else                                  console.log('✓  Conectado a Supabase');
  if (!process.env.STRIPE_SECRET_KEY)  console.log('ℹ  Stripe no configurado — pagos en demo');
  if (!process.env.RESEND_API_KEY)     console.log('ℹ  Resend no configurado — correos desactivados');
});
