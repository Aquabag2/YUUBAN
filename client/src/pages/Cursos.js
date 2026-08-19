import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ExternalLink, Music2, Search } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const COLOR_GRADIENTS = {
  violet:  'from-violet-500/20 to-indigo-500/10',
  emerald: 'from-emerald-500/20 to-teal-500/10',
  amber:   'from-amber-500/20 to-orange-500/10',
  rose:    'from-rose-500/20 to-pink-500/10',
  indigo:  'from-indigo-500/20 to-blue-500/10',
};
const COLOR_BADGE = {
  violet:  'bg-violet-500/20 text-violet-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  amber:   'bg-amber-500/20 text-amber-300',
  rose:    'bg-rose-500/20 text-rose-300',
  indigo:  'bg-indigo-500/20 text-indigo-300',
};
const COLOR_BUTTON = {
  violet:  'from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/20',
  emerald: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20',
  amber:   'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20',
  rose:    'from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/20',
  indigo:  'from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/20',
};

const Cursos = () => {
  const { profile } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    // Cargar todos los eventos publicados
    api.get('/events/published')
      .then(({ data }) => setEvents(data ?? []))
      .catch(() => {
        // Fallback: usar el evento de la API legada
        api.get('/event')
          .then(({ data }) => data ? setEvents([{ ...data, slug: data.slug ?? 'festival-yuuban-2026', cover_color: 'violet', is_published: true }]) : null)
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) =>
    search.trim() === '' ||
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const isStudent = profile?.role === 'student';

  return (
    <div className="space-y-8">

      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {isStudent ? 'Cursos disponibles' : 'Eventos activos'}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          {isStudent
            ? 'Explora los eventos en los que puedes inscribirte.'
            : 'Todos los eventos publicados en la plataforma.'}
        </p>
      </div>

      {/* ── Buscador ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
        <Search size={15} className="shrink-0 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o lugar…"
          className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="text-xs text-white/30 hover:text-white">✕</button>
        )}
      </div>

      {/* ── Grid de eventos ── */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Music2 size={28} className="text-white/20" />
          </div>
          <div>
            <div className="font-medium text-white/40">
              {search ? 'Sin resultados' : 'No hay eventos publicados aún'}
            </div>
            {!isStudent && !search && (
              <div className="mt-1 text-sm text-white/20">
                Ve a "Mi Evento" para publicar el tuyo.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ev) => {
            const color  = ev.cover_color ?? 'violet';
            const grad   = COLOR_GRADIENTS[color] ?? COLOR_GRADIENTS.violet;
            const badge  = COLOR_BADGE[color]     ?? COLOR_BADGE.violet;
            const btn    = COLOR_BUTTON[color]    ?? COLOR_BUTTON.violet;

            return (
              <div
                key={ev.id}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${grad} p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/40`}
              >
                {/* Badge */}
                <div className={`mb-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${badge}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Abierto · Inscripciones
                </div>

                {/* Info */}
                <h2 className="text-lg font-bold leading-snug text-white">{ev.title}</h2>
                {ev.summary && (
                  <p className="mt-2 line-clamp-2 text-sm text-white/50 leading-relaxed">{ev.summary}</p>
                )}

                <div className="mt-4 flex flex-col gap-1.5 text-xs text-white/40">
                  {ev.date && (
                    <span className="flex items-center gap-2">
                      <Calendar size={12} className="text-white/30" /> {ev.date}
                    </span>
                  )}
                  {ev.location && (
                    <span className="flex items-center gap-2">
                      <MapPin size={12} className="text-white/30" /> {ev.location}
                    </span>
                  )}
                </div>

                {/* Botones */}
                <div className="mt-5 flex gap-2">
                  <Link
                    to={`/e/${ev.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r py-2.5 text-sm font-semibold text-white shadow-lg transition-all ${btn}`}
                  >
                    Inscribirme <ExternalLink size={13} />
                  </Link>
                  <Link
                    to={`/e/${ev.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-xl border border-white/10 px-3 py-2.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                    title="Ver programa"
                  >
                    <Users size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Cursos;
