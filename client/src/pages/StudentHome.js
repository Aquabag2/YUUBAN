import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Trophy, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Rise, PostCard, EmptyState, initialsOf, POST_TYPES } from '../components/yb';

/* Inicio del alumno: accesos tipo "historias" + noticias de sus festivales */

const Story = ({ to, href, label, children, ring = true }) => {
  const inner = (
    <>
      <span className={`flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white ${ring ? 'ring-2 ring-yb-forest ring-offset-2 ring-offset-yb-paper' : 'border border-yb-rule'}`}>
        {children}
      </span>
      <span className="w-[74px] truncate text-center text-xs text-yb-ink">{label}</span>
    </>
  );
  const cls = 'flex shrink-0 flex-col items-center gap-2 transition-transform active:scale-95';
  if (href) return <a href={href} className={cls}>{inner}</a>;
  return <Link to={to} className={cls}>{inner}</Link>;
};

const FILTERS = [{ key: 'all', label: 'Todo' }, ...Object.entries(POST_TYPES).map(([key, label]) => ({ key, label: `${label}s` }))];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

const StudentHome = () => {
  const { user } = useAuth();
  const [posts, setPosts]     = useState(null);
  const [filter, setFilter]   = useState('all');
  const name = user?.email?.split('@')[0] ?? '';

  useEffect(() => {
    api.get('/my/feed').then(({ data }) => setPosts(data ?? [])).catch(() => setPosts([]));
  }, []);

  const events = useMemo(() => {
    const seen = new Map();
    (posts ?? []).forEach((p) => { if (p.events?.slug && !seen.has(p.events.slug)) seen.set(p.events.slug, p.events); });
    return [...seen.values()];
  }, [posts]);

  const visible = (posts ?? []).filter((p) => filter === 'all' || p.type === filter);

  return (
    <div>
      <Rise i={0}>
        <p className="text-sm text-yb-ink-muted">{greeting()},</p>
        <h1 className="font-yb-serif text-[34px] leading-tight">{name}</h1>
      </Rise>

      {/* Historias / accesos */}
      <Rise i={1} className="-mx-4 mt-6 sm:mx-0">
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 pt-1.5 sm:px-1 [scrollbar-width:none]">
          <Story to="/estudiante" label="Mis clases"><CalendarDays size={24} strokeWidth={1.6} /></Story>
          <Story to="/mis-concursos" label="Resultados"><Trophy size={24} strokeWidth={1.6} /></Story>
          {events.map((ev) => (
            <Story key={ev.slug} href={`/e/${ev.slug}`} label={ev.title}>
              <span className="font-yb-serif text-xl">{initialsOf(ev.title)}</span>
            </Story>
          ))}
          <Story to="/cursos" label="Explorar" ring={false}><Compass size={24} strokeWidth={1.6} /></Story>
        </div>
      </Rise>

      {/* Filtros */}
      <Rise i={2} className="mt-8 border-b border-yb-rule">
        <div className="-mb-px flex gap-6 overflow-x-auto text-sm [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`shrink-0 border-b-2 pb-3 transition-colors ${filter === f.key ? 'border-yb-ink font-semibold text-yb-ink' : 'border-transparent text-yb-ink-muted hover:text-yb-ink'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </Rise>

      {/* Noticias */}
      <div className="mt-6 space-y-5">
        {posts === null ? (
          [0, 1].map((i) => <div key={i} className="h-48 animate-pulse bg-yb-rule/60" />)
        ) : visible.length === 0 ? (
          <EmptyState
            title={posts.length ? 'Nada en esta categoría.' : 'Aún no hay noticias.'}
            text={posts.length ? 'Prueba con otro filtro.' : 'Cuando tus festivales publiquen anuncios, horarios o resultados, aparecerán aquí.'}
            action={!posts.length && (
              <Link to="/cursos" className="text-sm font-semibold underline decoration-1 underline-offset-4 hover:text-yb-forest">Explorar festivales</Link>
            )}
          />
        ) : (
          visible.map((p, i) => <Rise key={p.id} i={3 + Math.min(i, 5)}><PostCard post={p} /></Rise>)
        )}
      </div>
    </div>
  );
};

export default StudentHome;
