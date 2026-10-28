import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, MapPin, Calendar } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Rise, PageTitle, EmptyState, initialsOf } from '../components/yb';

const Cursos = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState(null);
  const [search, setSearch] = useState('');
  const isStudent = profile?.role === 'student';

  useEffect(() => {
    api.get('/events/published')
      .then(({ data }) => setEvents(data ?? []))
      .catch(() => {
        api.get('/event')
          .then(({ data }) => setEvents(data ? [{ ...data, slug: data.slug ?? 'festival-yuuban-2026' }] : []))
          .catch(() => setEvents([]));
      });
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = (events ?? []).filter((e) => !q || e.title?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q));

  return (
    <div className="font-yb-sans text-yb-ink">
      <PageTitle kicker="Explorar" title={isStudent ? 'Festivales' : 'Eventos activos'}
        subtitle={isStudent ? 'Festivales y cursos abiertos a inscripción.' : 'Todos los eventos publicados en la plataforma.'} />

      <Rise i={2} className="mb-6 flex items-center gap-3 border-b border-yb-ink/70 pb-2">
        <Search size={16} strokeWidth={1.6} className="text-yb-ink-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o lugar"
          className="flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-yb-ink-muted" />
      </Rise>

      {events === null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse bg-yb-rule/60" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title={search ? 'Sin resultados.' : 'No hay festivales publicados aún.'}
          text={!isStudent && !search ? 'Ve a "Mi Evento" para publicar el tuyo.' : undefined} />
      ) : (
        <ul className="border-t border-yb-rule">
          {filtered.map((ev, i) => (
            <Rise as="li" key={ev.id ?? ev.slug} i={3 + Math.min(i, 5)}>
              <Link to={`/e/${ev.slug}`} className="group flex items-center gap-4 border-b border-yb-rule py-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-lg text-yb-paper ring-2 ring-yb-forest ring-offset-2 ring-offset-yb-paper">
                  {initialsOf(ev.title)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-yb-serif text-[22px] leading-tight group-hover:text-yb-forest">{ev.title}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-yb-ink-muted">
                    {ev.date && <span className="flex items-center gap-1.5"><Calendar size={13} strokeWidth={1.6} />{ev.date}</span>}
                    {ev.location && <span className="flex items-center gap-1.5"><MapPin size={13} strokeWidth={1.6} />{ev.location}</span>}
                  </div>
                </div>
                <span className="hidden items-center gap-1 text-sm font-semibold sm:flex">Ver <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
                <ArrowRight size={16} className="sm:hidden" />
              </Link>
            </Rise>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Cursos;
