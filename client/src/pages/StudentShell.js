import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { Home, CalendarDays, Trophy, Compass, LogOut, CalendarClock, X, Eye, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initialsOf } from '../components/yb';
import StudentPanel from '../components/StudentPanel';
import RoleSwitch from '../components/RoleSwitch';
import { usePreviewSlug, isEmbedded } from '../lib/preview';

/*
 * App del alumno, estilo red social: barra inferior en celular, barra lateral
 * (solo íconos en tablet, completa en escritorio) y contenido centrado tipo feed.
 * El panel "Tu día" vive a la derecha del Inicio en escritorio y como hoja en celular.
 */
const TABS = [
  { to: '/dashboard',     label: 'Inicio',     icon: Home },
  { to: '/estudiante',    label: 'Clases',     icon: CalendarDays },
  { to: '/mis-concursos', label: 'Resultados', icon: Trophy },
  { to: '/cursos',        label: 'Festivales', icon: Compass },
];

const Avatar = ({ email, active, size = 'h-7 w-7 text-xs' }) => (
  <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-yb-paper ${active ? 'ring-2 ring-yb-ink ring-offset-2 ring-offset-yb-paper' : ''}`}>
    {initialsOf(email)}
  </span>
);

const sideLink = (isActive) =>
  `flex items-center gap-4 rounded-[3px] px-3 py-3 text-[15px] transition-colors md:justify-center lg:justify-start ${isActive ? 'font-semibold text-yb-ink' : 'text-yb-ink/75 hover:bg-white/70 hover:text-yb-ink'}`;

/* Hoja inferior en celular; cajón a la derecha en tablet/laptop */
const Sheet = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Tu día">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 animate-yb-fade bg-yb-ink/40" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] animate-yb-sheet flex-col rounded-t-2xl bg-yb-paper shadow-2xl motion-reduce:animate-none md:inset-y-0 md:left-auto md:max-h-none md:w-[380px] md:animate-yb-fade md:rounded-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <span className="mx-auto h-1 w-10 rounded-full bg-yb-rule md:hidden" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="font-yb-serif text-[28px] leading-none">Tu día</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="-mr-2 p-2 text-yb-ink-muted hover:text-yb-ink"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-8 pt-2">
          <StudentPanel onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
};

/* Barra de vista previa para admins (/vista-alumno/:slug) */
const PreviewBar = ({ slug }) => (
  <div className="sticky top-0 z-50 flex h-11 items-center gap-3 bg-yb-ink px-4 text-xs text-yb-paper sm:text-sm">
    <Eye size={15} className="shrink-0 text-yb-helecho" />
    <span className="min-w-0 flex-1 truncate"><span className="font-semibold">Vista previa:</span> así ve su inicio un alumno inscrito</span>
    <Link to={`/e/${slug}`} className="hidden items-center gap-1.5 font-semibold text-yb-helecho hover:underline sm:flex"><Mail size={14} /> Ver invitación</Link>
    <Link to="/vistas" className="flex shrink-0 items-center gap-1.5 rounded-full bg-yb-paper/10 px-3 py-1 font-semibold hover:bg-yb-paper/20"><ArrowLeft size={14} /> Salir</Link>
  </div>
);

const StudentShell = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const [sheet, setSheet] = useState(false);
  const previewSlug = usePreviewSlug();
  const homePath = previewSlug ? `/vista-alumno/${previewSlug}` : '/dashboard';
  // En vista previa solo existe el Inicio; el resto de pestañas son del alumno real
  const tabs = previewSlug ? [{ ...TABS[0], to: homePath }] : TABS;
  const onProfile = pathname === '/perfil';
  const isHome = pathname === homePath;
  // La barra de vista previa no se muestra si la página va incrustada en el panel del evento
  const bar = !!previewSlug && !isEmbedded();
  const top = bar ? 'md:top-11' : '';

  return (
    <div className="min-h-screen bg-yb-paper font-yb-sans text-yb-ink">
      {bar && <PreviewBar slug={previewSlug} />}

      {/* Barra lateral (tablet: íconos · escritorio: completa) */}
      <aside className={`fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col border-r border-yb-rule bg-yb-paper px-3 py-6 md:flex lg:w-60 lg:px-4 ${top}`}>
        <Link to={homePath} className="px-3 font-yb-serif text-[30px] leading-none tracking-tight">
          <span className="lg:hidden">Y</span><span className="hidden lg:inline">Yuuban</span>
        </Link>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} title={label} className={({ isActive }) => sideLink(isActive)}>
              {({ isActive }) => (<><Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} className="shrink-0" /><span className="md:hidden lg:inline">{label}</span></>)}
            </NavLink>
          ))}
          {!previewSlug && (
            <NavLink to="/perfil" title="Perfil" className={({ isActive }) => sideLink(isActive)}>
              <Avatar email={user?.email} active={onProfile} size="h-[22px] w-[22px] text-[10px]" /><span className="md:hidden lg:inline">Perfil</span>
            </NavLink>
          )}
        </nav>
        {!previewSlug && (
          <div className="mb-3">
            <div className="flex justify-center lg:hidden"><RoleSwitch compact vertical /></div>
            <div className="hidden lg:block">
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-yb-ink-muted">Entrar como</div>
              <RoleSwitch className="w-full [&>button]:flex-1" />
            </div>
          </div>
        )}
        {!previewSlug && (
          <button type="button" onClick={signOut} title="Cerrar sesión"
            className="flex items-center gap-4 rounded-[3px] px-3 py-3 text-sm text-yb-ink-muted transition-colors hover:text-yb-ink md:justify-center lg:justify-start">
            <LogOut size={20} strokeWidth={1.6} className="shrink-0" /><span className="md:hidden lg:inline">Cerrar sesión</span>
          </button>
        )}
      </aside>

      {/* Barra superior (celular) */}
      <header className={`sticky z-30 flex h-14 ${bar ? 'top-11' : 'top-0'} items-center justify-between border-b border-yb-rule bg-yb-paper/90 px-4 backdrop-blur md:hidden`}>
        <Link to={homePath} className="font-yb-serif text-[26px] leading-none tracking-tight">Yuuban</Link>
        <div className="-mr-1 flex items-center gap-2">
        {!previewSlug && <RoleSwitch compact />}
        <button type="button" onClick={() => setSheet(true)}
          className="flex items-center gap-1.5 rounded-full border border-yb-rule bg-white px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95">
          <CalendarClock size={15} strokeWidth={1.8} /> Tu día
        </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="pb-24 md:ml-[76px] md:pb-12 lg:ml-60">
        <div key={pathname}
          className={`mx-auto w-full px-4 py-6 sm:px-6 md:py-10 ${isHome ? 'max-w-[1000px]' : 'max-w-[640px]'}`}>
          <Outlet />
        </div>
      </main>

      {/* Barra inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-yb-rule bg-yb-paper/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className={`mx-auto grid h-14 max-w-md ${previewSlug ? 'grid-cols-1' : 'grid-cols-5'}`}>
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} aria-label={label}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive ? 'font-semibold text-yb-ink' : 'text-yb-ink-muted'}`}>
              {({ isActive }) => (<><Icon size={23} strokeWidth={isActive ? 2.2 : 1.6} />{label}</>)}
            </NavLink>
          ))}
          {!previewSlug && (
            <NavLink to="/perfil" aria-label="Perfil"
              className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive ? 'font-semibold text-yb-ink' : 'text-yb-ink-muted'}`}>
              <Avatar email={user?.email} active={onProfile} size="h-6 w-6 text-[10px]" />Perfil
            </NavLink>
          )}
        </div>
      </nav>

      {/* Botón "Tu día" en tablet/laptop (en escritorio grande el Inicio ya muestra el panel) */}
      <button type="button" onClick={() => setSheet(true)}
        className={`fixed right-6 z-30 ${bar ? 'top-16' : 'top-6'} hidden items-center gap-1.5 rounded-full border border-yb-rule bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-yb-ink/40 active:scale-95 md:flex ${isHome ? 'xl:hidden' : ''}`}>
        <CalendarClock size={16} strokeWidth={1.8} /> Tu día
      </button>

      <Sheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
};

export default StudentShell;
