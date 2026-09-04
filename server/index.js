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

app.use('/api',         eventsRouter);
app.use('/api/ticket',  ticketsRouter);
app.use('/api',         adminRouter);
app.use('/api/super',   superRouter);
app.use('/api',         paymentsRouter);
app.use('/api',         certificatesRouter);

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
