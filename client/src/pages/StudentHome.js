import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Compass, Sparkles, PartyPopper, Ticket, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Rise, PostCard, EmptyState, initialsOf, POST_TYPES } from '../components/yb';
import StudentPanel, { useOverview } from '../components/StudentPanel';
import { usePreviewSlug, feedUrl } from '../lib/preview';

/* Inicio del alumno estilo Instagram: historias por festival, feed y panel "Tu día" a la derecha */

const TYPE_FILTERS = [{ key: 'all', label: 'Todo' }, ...Object.entries(POST_TYPES).map(([key, label]) => ({ key, label: `${label}s` }))];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

// Historia: anillo de color si tiene algo de las últimas 48 h
const Story = ({ label, active, fresh, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95">
    <span className={`rounded-full p-[2.5px] ${fresh ? 'bg-gradient-to-tr from-yb-laton via-yb-helecho to-yb-forest' : 'bg-yb-rule'} ${active ? 'scale-105' : ''} transition-transform`}>
      <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-[3px] border-yb-paper bg-yb-ink font-yb-serif text-xl text-yb-paper">
        {children}
      </span>
    </span>
    <span className={`w-full truncate text-center text-xs ${active ? 'font-semibold text-yb-ink' : 'text-yb-ink/80'}`}>{label}</span>
  </button>
);

const StudentHome = () => {
  const { user } = useAuth();
  const [posts, setPosts]   = useState(null);
  const [type, setType]     = useState('all');
  const [eventSlug, setEventSlug] = useState(null);
  const previewSlug = usePreviewSlug();
  // Recién inscrito: /dashboard?bienvenida=<slug>
  const [params, setParams] = useSearchParams();
  const welcomeSlug = params.get('bienvenida');
  const overview = useOverview();
  const welcome = welcomeSlug && overview?.tickets?.find((t) => t.event.slug === welcomeSlug);
  const closeWelcome = () => setParams({}, { replace: true });
  const name = previewSlug ? 'Alumno' : (user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '');

  useEffect(() => {
    setPosts(null);
    api.get(feedUrl(previewSlug)).then(({ data }) => setPosts(data ?? [])).catch(() => setPosts([]));
  }, [previewSlug]);

  // Un "historia" por festival, primero los que publicaron hace poco
  const stories = useMemo(() => {
    const map = new Map();
    (posts ?? []).forEach((p) => {
      const ev = p.events;
      if (!ev?.slug) return;
      const at = new Date(p.created_at).getTime();
      const prev = map.get(ev.slug);
      if (!prev || at > prev.last) map.set(ev.slug, { ...ev, last: at });
    });
    return [...map.values()].sort((a, b) => b.last - a.last);
  }, [posts]);

  const visible = (posts ?? []).filter((p) =>
    (type === 'all' || p.type === type) && (!eventSlug || p.events?.slug === eventSlug));

  const activeEvent = stories.find((s) => s.slug === eventSlug);

  return (
    <div className="flex gap-16">
      {/* Feed */}
      <div className="mx-auto w-full min-w-0 max-w-[600px] xl:mx-0">
        <Rise i={0}>
          <p className="text-sm text-yb-ink-muted">{greeting()},</p>
          <h1 className="font-yb-serif text-[34px] leading-tight">{name}</h1>
        </Rise>

        {/* Bienvenida tras inscribirse */}
        {welcome && (
          <Rise i={1} className="relative mt-5 overflow-hidden bg-yb-forest p-5 text-yb-paper sm:p-6">
            <button type="button" onClick={closeWelcome} aria-label="Cerrar" className="absolute right-3 top-3 p-1 text-yb-paper/60 hover:text-yb-paper"><X size={18} /></button>
            <PartyPopper aria-hidden="true" strokeWidth={1} className="pointer-events-none absolute -bottom-6 -right-4 h-32 w-32 text-yb-helecho opacity-20" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yb-helecho">Inscripción confirmada</div>
            <div className="mt-2 pr-8 font-yb-serif text-[28px] leading-tight">¡Ya estás en {welcome.event.title}!</div>
            <p className="mt-2 max-w-md text-sm text-yb-paper/80">
              Aquí verás sus anuncios, horarios y resultados. Tu boleto y tus constancias están en <span className="font-semibold text-yb-paper">Tu día</span>.
            </p>
            <Link to={`/ticket/${welcome.ticket_token}`}
              className="mt-4 inline-flex items-center gap-2 bg-yb-helecho px-4 py-2.5 text-sm font-semibold text-yb-ink transition hover:brightness-105">
              <Ticket size={15} /> Ver mi boleto QR
            </Link>
          </Rise>
        )}

        {/* Historias */}
        {stories.length > 0 && (
          <Rise i={1} className="-mx-4 mt-5 sm:mx-0">
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 pt-1 sm:px-0 [scrollbar-width:none]">
              <Story label="Todo" active={!eventSlug} fresh={false} onClick={() => setEventSlug(null)}>
                <Sparkles size={22} strokeWidth={1.6} />
              </Story>
              {stories.map((ev) => (
                <Story key={ev.slug} label={ev.title} active={eventSlug === ev.slug}
                  fresh={Date.now() - ev.last < 48 * 3600 * 1000}
                  onClick={() => setEventSlug(eventSlug === ev.slug ? null : ev.slug)}>
                  {initialsOf(ev.title)}
                </Story>
              ))}
              <Link to="/cursos" className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95">
                <span className="flex h-[67px] w-[67px] items-center justify-center rounded-full border border-dashed border-yb-ink/30 bg-white">
                  <Compass size={22} strokeWidth={1.6} />
                </span>
                <span className="text-xs text-yb-ink/80">Explorar</span>
              </Link>
            </div>
          </Rise>
        )}

        {/* Chips por tipo */}
        <Rise i={2} className="-mx-4 mt-5 sm:mx-0">
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 sm:px-0 [scrollbar-width:none]">
            {TYPE_FILTERS.map((f) => (
              <button key={f.key} type="button" onClick={() => setType(f.key)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${type === f.key ? 'border-yb-ink bg-yb-ink text-yb-paper' : 'border-yb-rule bg-white text-yb-ink hover:border-yb-ink/40'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </Rise>

        {activeEvent && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-yb-ink-muted">Viendo <span className="font-semibold text-yb-ink">{activeEvent.title}</span></span>
            <Link to={`/e/${activeEvent.slug}`} className="font-semibold underline decoration-1 underline-offset-4 hover:text-yb-forest">Ver festival</Link>
          </div>
        )}

        {/* Publicaciones */}
        <div className="mt-6 space-y-6 sm:space-y-8">
          {posts === null ? (
            [0, 1].map((i) => (
              <div key={i}>
                <div className="flex items-center gap-3 py-3"><div className="h-9 w-9 animate-pulse rounded-full bg-yb-rule" /><div className="h-3 w-32 animate-pulse bg-yb-rule" /></div>
                <div className="aspect-[5/4] animate-pulse bg-yb-rule/60" />
              </div>
            ))
          ) : visible.length === 0 ? (
            <EmptyState
              title={posts.length ? 'Nada por aquí.' : 'Tu feed está vacío.'}
              text={posts.length
                ? 'Prueba con otro filtro o festival.'
                : 'Inscríbete a un festival y aquí verás sus anuncios, horarios y resultados.'}
              action={!posts.length && (
                <Link to="/cursos" className="text-sm font-semibold underline decoration-1 underline-offset-4 hover:text-yb-forest">Explorar festivales</Link>
              )}
            />
          ) : (
            visible.map((p, i) => <Rise key={p.id} i={3 + Math.min(i, 4)}><PostCard post={p} /></Rise>)
          )}
          {visible.length > 2 && <p className="py-6 text-center text-sm text-yb-ink-muted">Ya viste todo lo nuevo ✓</p>}
        </div>
      </div>

      {/* Panel derecho (escritorio grande) */}
      <aside className="hidden w-[320px] shrink-0 xl:block">
        <div className="sticky top-10 max-h-[calc(100vh-5rem)] overflow-y-auto pb-6 [scrollbar-width:thin]">
          <Rise i={2}><StudentPanel /></Rise>
        </div>
      </aside>
    </div>
  );
};

export default StudentHome;
