import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Trophy, Compass, Newspaper, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Rise, initialsOf } from '../components/yb';

const ROLE_LABELS = { student: 'Alumno', admin: 'Administrador', super_admin: 'Super Admin' };

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="font-yb-serif text-[28px] leading-none">{value ?? '—'}</div>
    <div className="mt-1 text-xs text-yb-ink-muted">{label}</div>
  </div>
);

const Row = ({ to, icon: Icon, label }) => (
  <Link to={to} className="flex items-center gap-4 border-b border-yb-rule py-4 transition-colors hover:text-yb-forest">
    <Icon size={18} strokeWidth={1.6} className="text-yb-ink-muted" />
    <span className="flex-1 text-[15px]">{label}</span>
    <ChevronRight size={16} className="text-yb-ink-muted" />
  </Link>
);

const Perfil = () => {
  const { user, profile, signOut } = useAuth();
  const [counts, setCounts] = useState({});
  const name = user?.email?.split('@')[0] ?? '';

  useEffect(() => {
    Promise.all([
      api.get('/my/feed').catch(() => ({ data: [] })),
      api.get('/my-contests').catch(() => ({ data: [] })),
    ]).then(([feed, contests]) => {
      const festivals = new Set((feed.data ?? []).map((p) => p.events?.slug).filter(Boolean)).size;
      setCounts({ festivals, contests: (contests.data ?? []).length, posts: (feed.data ?? []).length });
    });
  }, []);

  return (
    <div>
      <Rise i={0} className="flex items-center gap-6 sm:gap-10">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-4xl text-yb-paper ring-2 ring-yb-forest ring-offset-4 ring-offset-yb-paper">
          {initialsOf(user?.email)}
        </span>
        <div className="grid flex-1 grid-cols-3 gap-2">
          <Stat value={counts.festivals} label="Festivales" />
          <Stat value={counts.contests} label="Concursos" />
          <Stat value={counts.posts} label="Noticias" />
        </div>
      </Rise>

      <Rise i={1} className="mt-6">
        <h1 className="font-yb-serif text-3xl leading-tight">{name}</h1>
        <p className="text-sm text-yb-ink-muted">{user?.email}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-yb-forest">{ROLE_LABELS[profile?.role] ?? 'Alumno'}</p>
      </Rise>

      <Rise i={2} className="mt-8 border-t border-yb-rule">
        <Row to="/estudiante"    icon={CalendarDays} label="Mis clases" />
        <Row to="/mis-concursos" icon={Trophy}       label="Concursos y resultados" />
        <Row to="/novedades"     icon={Newspaper}    label="Todas las noticias" />
        <Row to="/cursos"        icon={Compass}      label="Explorar festivales" />
        <button type="button" onClick={signOut}
          className="flex w-full items-center gap-4 border-b border-yb-rule py-4 text-left text-[15px] text-red-700 transition-colors hover:text-red-800">
          <LogOut size={18} strokeWidth={1.6} /> Cerrar sesión
        </button>
      </Rise>
    </div>
  );
};

export default Perfil;
