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
const authRouter          = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 8000;

// Detrás del proxy de Vercel/Railway: usa la IP real del cliente para el rate limit
app.set('trust proxy', 1);

// ── Seguridad ─────────────────────────────────────────────────────────────────

// Cabeceras de seguridad HTTP (previene XSS, clickjacking, sniffing, etc.)
app.use(helmet());
app.disable('x-powered-by');

// Sin Supabase el servidor corre en modo demo (todo abierto); en producción eso nunca debe pasar
if (process.env.NODE_ENV === 'production' && !require('./lib/supabase')) {
  console.error('⚠  NODE_ENV=production sin Supabase configurado: la API queda bloqueada');
  app.use('/api', (_req, res) => res.status(503).json({ error: 'Servicio no configurado' }));
}

// CORS estricto: solo acepta peticiones del frontend oficial
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting general: máx. 100 peticiones por IP cada 15 minutos
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
  skip: (req) => req.path === '/health' || req.path === '/api/stripe/webhook', // no cuentan
}));

// Rate limiting más estricto para login/registro (previene fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Intenta en 15 minutos.' },
});
app.use('/api/e/:slug/checkout',  authLimiter);
app.use('/api/e/:slug/register',  authLimiter);
app.use('/api/auth',              authLimiter);

// Webhook de Stripe: necesita el body crudo para validar la firma, va antes de express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), paymentsRouter.webhook);

app.use(express.json({ limit: '1mb' })); // limita tamaño del body

// En producción los errores 5xx no exponen detalles internos (tablas, columnas, claves)
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  app.use((req, res, next) => {
    const json = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 500 && body && typeof body.error === 'string') {
        console.error(`[${req.method} ${req.path}]`, body.error);
        return json({ ...body, error: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
      }
      return json(body);
    };
    next();
  });
}

// Logger solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });
}

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, name: 'yuuban-server' }));

app.use('/api',         eventsRouter);
app.use('/api/ticket',  ticketsRouter);
app.use('/api',         adminRouter);
app.use('/api/super',   superRouter);
app.use('/api',         paymentsRouter);
app.use('/api',         certificatesRouter);
app.use('/api',         postsRouter);
app.use('/api/auth',    authRouter);

// ── Perfil del usuario autenticado ────────────────────────────────────────────
const { requireAuth } = require('./middleware/auth');
const sb = require('./lib/supabase');
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    if (!sb) return res.json({ id: req.user.id, role: 'admin' }); // modo demo local
    const { data, error } = await sb
      .from('user_profiles').select('id, role, created_at').eq('id', req.user.id).maybeSingle();
    if (error) {
      console.error('[profile] SELECT error:', error.message, error.code, error.details);
      return res.json({ id: req.user.id, role: 'student' });
    }
    if (!data) return res.json({ id: req.user.id, role: 'student' });
    res.json(data);
  } catch (err) {
    console.error('[profile] exception:', err.message);
    res.json({ id: req.user.id, role: 'student' });
  }
});

// ── 404 y errores globales ────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Inicio ────────────────────────────────────────────────────────────────────
// En Vercel se importa como función serverless; local/Railway levanta el servidor
module.exports = app;

if (require.main === module) app.listen(PORT, () => {
  console.log(`Yuuban server en puerto ${PORT} (${process.env.NODE_ENV || 'development'})`);
  if (!sb)                              console.log('⚠  Supabase no configurado — modo demo');
  else                                  console.log('✓  Conectado a Supabase');
  if (!process.env.STRIPE_SECRET_KEY)  console.log('ℹ  Stripe no configurado — pagos en demo');
  if (!process.env.RESEND_API_KEY)     console.log('ℹ  Resend no configurado — correos desactivados');
});
