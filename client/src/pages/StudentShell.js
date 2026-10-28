import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { Home, CalendarDays, Trophy, Compass, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initialsOf } from '../components/yb';

/*
 * App del alumno, estilo red social: barra inferior en celular,
 * barra lateral angosta en escritorio, contenido centrado tipo feed.
 */
const TABS = [
  { to: '/dashboard',     label: 'Inicio',     icon: Home },
  { to: '/estudiante',    label: 'Clases',     icon: CalendarDays },
  { to: '/mis-concursos', label: 'Resultados', icon: Trophy },
  { to: '/cursos',        label: 'Festivales', icon: Compass },
];

const Avatar = ({ email, active, size = 'h-7 w-7 text-xs' }) => (
  <span className={`flex ${size} items-center justify-center rounded-full bg-yb-ink font-yb-serif text-yb-paper ${active ? 'ring-2 ring-yb-ink ring-offset-2 ring-offset-yb-paper' : ''}`}>
    {initialsOf(email)}
  </span>
);

const StudentShell = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const onProfile = pathname === '/perfil';

  return (
    <div className="min-h-screen bg-yb-paper font-yb-sans text-yb-ink">

      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-yb-rule bg-yb-paper px-4 py-6 md:flex">
        <Link to="/dashboard" className="px-3 font-yb-serif text-[30px] leading-none tracking-tight">Yuuban</Link>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex items-center gap-4 rounded-[3px] px-3 py-3 text-[15px] transition-colors ${isActive ? 'font-semibold text-yb-ink' : 'text-yb-ink/75 hover:bg-white/70 hover:text-yb-ink'}`}>
              {({ isActive }) => (<><Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />{label}</>)}
            </NavLink>
          ))}
          <NavLink to="/perfil"
            className={({ isActive }) => `flex items-center gap-4 rounded-[3px] px-3 py-3 text-[15px] transition-colors ${isActive ? 'font-semibold' : 'text-yb-ink/75 hover:bg-white/70 hover:text-yb-ink'}`}>
            <Avatar email={user?.email} active={onProfile} size="h-[22px] w-[22px] text-[10px]" /> Perfil
          </NavLink>
        </nav>
        <button type="button" onClick={signOut}
          className="flex items-center gap-4 rounded-[3px] px-3 py-3 text-sm text-yb-ink-muted transition-colors hover:text-yb-ink">
          <LogOut size={20} strokeWidth={1.6} /> Cerrar sesión
        </button>
      </aside>

      {/* Barra superior (celular) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-yb-rule bg-yb-paper/90 px-4 backdrop-blur md:hidden">
        <Link to="/dashboard" className="font-yb-serif text-[26px] leading-none tracking-tight">Yuuban</Link>
      </header>

      {/* Contenido */}
      <main className="pb-24 md:ml-60 md:pb-12">
        <div key={pathname} className="mx-auto w-full max-w-[640px] px-4 py-6 sm:px-6 md:py-10">
          <Outlet />
        </div>
      </main>

      {/* Barra inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-yb-rule bg-yb-paper/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto grid h-14 max-w-md grid-cols-5">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} aria-label={label}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive ? 'font-semibold text-yb-ink' : 'text-yb-ink-muted'}`}>
              {({ isActive }) => (<><Icon size={23} strokeWidth={isActive ? 2.2 : 1.6} />{label}</>)}
            </NavLink>
          ))}
          <NavLink to="/perfil" aria-label="Perfil"
            className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive ? 'font-semibold text-yb-ink' : 'text-yb-ink-muted'}`}>
            <Avatar email={user?.email} active={onProfile} size="h-6 w-6 text-[10px]" />Perfil
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default StudentShell;
