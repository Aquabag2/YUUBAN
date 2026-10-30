import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Smartphone, Link2, Search, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Rise, PageTitle, EmptyState, initialsOf } from '../components/yb';

/*
 * Vistas previas para admins: por cada evento, abrir la invitación (donde se inscriben)
 * o el inicio del alumno tal como lo ve un inscrito. El super_admin ve todos los eventos.
 */

const ViewTile = ({ to, icon: Icon, title, text, dark }) => (
  <Link to={to}
    className={`group relative flex flex-col justify-between overflow-hidden p-5 transition-transform hover:-translate-y-0.5 ${dark ? 'bg-yb-ink text-yb-paper' : 'border border-yb-rule bg-white text-yb-ink'}`}>
    <Icon aria-hidden="true" strokeWidth={1} className={`pointer-events-none absolute -bottom-5 -right-5 h-24 w-24 ${dark ? 'opacity-15' : 'opacity-10'}`} />
    <div className="flex items-center justify-between">
      <Icon size={20} strokeWidth={1.6} />
      <ArrowUpRight size={16} className="opacity-50 transition-opacity group-hover:opacity-100" />
    </div>
    <div className="mt-6">
      <div className="font-yb-serif text-[22px] leading-tight">{title}</div>
      <p className={`mt-1 text-sm ${dark ? 'text-yb-paper/70' : 'text-yb-ink-muted'}`}>{text}</p>
    </div>
  </Link>
);

const Vistas = () => {
  const { profile } = useAuth();
  const isSuper = profile?.role === 'super_admin';
  const [events, setEvents] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get(isSuper ? '/super/events' : '/my-event')
      .then(({ data }) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, [isSuper]);

  const visible = useMemo(() => (events ?? []).filter((e) =>
    !q.trim() || `${e.title} ${e.location ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())), [events, q]);

  const copyLink = async (slug) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/e/${slug}`);
      toast.success('Enlace de invitación copiado');
    } catch { toast.error('No se pudo copiar'); }
  };

  return (
    <div className="mx-auto max-w-[920px] font-yb-sans text-yb-ink">
      <PageTitle kicker="Control total" title="Vistas previas"
        subtitle="Mira cada evento como lo ven tus invitados y tus alumnos, incluso si aún está en borrador." />

      {events?.length > 4 && (
        <Rise i={2} className="relative mb-6">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-yb-ink-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar evento…"
            className="w-full rounded-[3px] border border-yb-rule bg-white py-3 pl-10 pr-4 text-[15px] outline-none transition focus:border-yb-ink" />
        </Rise>
      )}

      {events === null ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-56 animate-pulse bg-yb-rule/60" />)}</div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={events.length ? 'Ningún evento coincide.' : 'Aún no tienes eventos.'}
          text={events.length ? 'Prueba con otra búsqueda.' : 'Crea tu primer evento y aquí podrás ver su invitación y el inicio del alumno.'}
          action={!events.length && <Link to="/mi-evento" className="text-sm font-semibold underline decoration-1 underline-offset-4 hover:text-yb-forest">Crear evento</Link>}
        />
      ) : (
        <div className="space-y-5">
          {visible.map((ev, i) => (
            <Rise key={ev.id} i={2 + Math.min(i, 5)} as="section" className="border border-yb-rule bg-yb-paper p-5 sm:p-6">
              <header className="flex flex-wrap items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-lg text-yb-paper">
                  {initialsOf(ev.title)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-yb-serif text-[26px] leading-tight">{ev.title}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ev.is_published ? 'bg-yb-forest/10 text-yb-forest' : 'bg-yb-laton/20 text-yb-madera'}`}>
                      {ev.is_published ? 'Publicado' : 'Borrador · solo tú lo ves'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-yb-ink-muted">
                    {[ev.date, ev.location, isSuper && ev.client?.name].filter(Boolean).join(' · ') || `/e/${ev.slug}`}
                  </p>
                </div>
                {ev.is_published && (
                  <button type="button" onClick={() => copyLink(ev.slug)}
                    className="flex items-center gap-1.5 text-sm font-semibold underline decoration-1 underline-offset-4 hover:text-yb-forest">
                    <Link2 size={14} /> Copiar enlace
                  </button>
                )}
              </header>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ViewTile to={`/e/${ev.slug}`} icon={Mail} title="Invitación"
                  text="La página donde se inscriben: datos, programa y formulario." />
                <ViewTile to={`/vista-alumno/${ev.slug}`} icon={Smartphone} title="Inicio del alumno" dark
                  text="Feed, horario, boletos y anuncios tal como lo ve un inscrito." />
              </div>
            </Rise>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vistas;
