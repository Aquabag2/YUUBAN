require('dotenv').config();
const express  = require('express');
const cors     = require('cors');

const eventsRouter   = require('./routes/events');
const ticketsRouter  = require('./routes/tickets');
const adminRouter    = require('./routes/admin');
const superRouter    = require('./routes/super');
const paymentsRouter = require('./routes/payments');

const app  = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });

app.get('/health', (_req, res) => res.json({ ok: true, name: 'yuuban-server' }));

app.use('/api', eventsRouter);
app.use('/api/ticket', ticketsRouter);
app.use('/api', adminRouter);
app.use('/api/super', superRouter);
app.use('/api', paymentsRouter);

const sb = require('./lib/supabase');

app.listen(PORT, () => {
  console.log(`Yuuban server en puerto ${PORT}`);
  if (!sb) {
    console.log('⚠  Supabase no configurado — modo demo con datos de prueba');
    console.log('   Agrega SUPABASE_URL y SUPABASE_SERVICE_KEY en server/.env');
  } else {
    console.log('✓  Conectado a Supabase');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('ℹ  STRIPE_SECRET_KEY no configurado — pagos en modo demo');
  }
});
