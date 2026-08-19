// Fallback cuando Supabase no está configurado (solo desarrollo sin .env)
module.exports = {
  event: {
    id: 1, title: 'Festival Yuuban 2026', location: 'Auditorio Principal',
    date: '12-14 Marzo, 2026', summary: 'Encuentro musical con conciertos, clases y actividades.',
    slug: 'festival-yuuban-2026', is_published: true, cover_color: 'violet', price_cents: 0,
  },
  schedule:       [],
  workflow:       [],
  teachers:       [],
  students:       [],
  studentSchedule:[],
  messages:       [],
  stats:          [],
  superMetrics: { mrr: '$0', activeClients: 0, totalEvents: 0, platformUptime: '—', newThisMonth: 0, churnThisMonth: 0 },
  superClients:   [],
};
