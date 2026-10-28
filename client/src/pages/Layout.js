import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StudentShell from './StudentShell';
import {
  LayoutDashboard, Users, ShieldCheck, LogOut,
  GraduationCap, Megaphone, BookOpen, Home, ChevronLeft,
  ChevronRight, Calendar, Menu, X, Trophy, Map, UserCheck,
} from 'lucide-react';

// ── Navegación por rol ────────────────────────────────────────────────────────
const NAV = {
  student: [
    { section: 'Principal' },
    { to: '/dashboard',        label: 'Dashboard',      icon: Home },
    { to: '/novedades',        label: 'Novedades',      icon: Megaphone },
    { section: 'Aprendizaje' },
    { to: '/cursos',           label: 'Cursos',         icon: BookOpen },
    { to: '/estudiante',       label: 'Mis Clases',     icon: GraduationCap },
    { to: '/mis-concursos',    label: 'Mis Concursos',  icon: Trophy },
  ],
  admin: [
    { section: 'Principal' },
    { to: '/dashboard',     label: 'Dashboard',      icon: Home },
    { section: 'Gestión' },
    { to: '/admin',         label: 'Panel Admin',    icon: LayoutDashboard },
    { to: '/mi-evento',     label: 'Mi Evento',      icon: Calendar },
    { to: '/maestros',      label: 'Maestros',       icon: Users },
    { to: '/coordinacion',  label: 'Coordinación',   icon: UserCheck },
    { section: 'Comunidad' },
    { to: '/novedades',     label: 'Novedades',      icon: Megaphone },
    { to: '/cursos',        label: 'Cursos',         icon: BookOpen },
    { section: 'Referencia' },
    { to: '/mapa',          label: 'Mapa del sistema', icon: Map },
  ],
  super_admin: [
    { section: 'Principal' },
    { to: '/dashboard',     label: 'Dashboard',      icon: Home },
    { section: 'Super Admin' },
    { to: '/super',         label: 'Plataforma',     icon: ShieldCheck, accent: true },
    { section: 'Gestión' },
    { to: '/admin',         label: 'Panel Admin',    icon: LayoutDashboard },
    { to: '/mi-evento',     label: 'Mi Evento',      icon: Calendar },
    { to: '/maestros',      label: 'Maestros',       icon: Users },
    { to: '/coordinacion',  label: 'Coordinación',   icon: UserCheck },
    { section: 'Comunidad' },
    { to: '/novedades',     label: 'Novedades',      icon: Megaphone },
    { to: '/cursos',        label: 'Cursos',         icon: BookOpen },
    { section: 'Referencia' },
    { to: '/mapa',          label: 'Mapa del sistema', icon: Map },
  ],
};

const ROLE_LABELS = {
  student:     'Estudiante',
  admin:       'Administrador',
  super_admin: 'Super Admin',
};
// ── Nombre de la página actual ─────────────────────────────────────────────────
const PAGE_NAMES = {
  '/dashboard':  'Dashboard',
  '/admin':      'Panel Admin',
  '/mi-evento':  'Mi Evento',
  '/maestros':   'Maestros',
  '/novedades':  'Novedades',
  '/cursos':     'Cursos',
  '/estudiante':    'Mis Clases',
  '/mis-concursos':  'Mis Concursos',
  '/coordinacion':   'Coordinación',
  '/mapa':           'Mapa del sistema',
  '/super':         'Plataforma',
  '/flujo':      'Flujo',
};

// ── Sidebar ────────────────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle, onClose, mobile }) => {
  const { user, profile, signOut } = useAuth();
  const role      = profile?.role ?? 'admin';
  const items     = NAV[role] ?? NAV.admin;
  const initials  = user?.email?.charAt(0).toUpperCase() ?? '?';
  const roleLabel = ROLE_LABELS[role] ?? role;
  const wide      = !collapsed || mobile;

  return (
    <aside className={`flex h-full flex-col border-r border-yb-rule bg-yb-paper font-yb-sans ${collapsed && !mobile ? 'w-16' : 'w-60'} transition-all duration-200`}>

      {/* Marca */}
      <div className={`flex h-[68px] shrink-0 items-center gap-3 px-5 ${!wide ? 'justify-center px-0' : ''}`}>
        {wide ? (
          <div className="min-w-0">
            <div className="font-yb-serif text-[26px] leading-none tracking-tight text-yb-ink">Yuuban</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-yb-ink-muted">Panel de gestión</div>
          </div>
        ) : (
          <span className="font-yb-serif text-2xl text-yb-ink">Y</span>
        )}
        {mobile && (
          <button onClick={onClose} aria-label="Cerrar menú" className="ml-auto p-1 text-yb-ink-muted hover:text-yb-ink">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {items.map((item, i) => {
          if (item.section) {
            if (!wide) return <div key={i} className="mx-3 my-3 h-px bg-yb-rule" />;
            return (
              <div key={i} className="px-3 pb-1.5 pt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-yb-ink-muted">
                {item.section}
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to}
              onClick={mobile ? onClose : undefined}
              title={!wide ? item.label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-[3px] px-3 py-2 text-[14px] transition-colors duration-150
                ${!wide ? 'justify-center px-0' : ''}
                ${isActive
                  ? 'bg-white font-semibold text-yb-ink shadow-[0_0_0_1px_#e3e1d8]'
                  : 'text-yb-ink-muted hover:bg-white/60 hover:text-yb-ink'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.6} className={`shrink-0 ${isActive ? 'text-yb-forest' : ''}`} />
                  {wide && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Usuario */}
      <div className="shrink-0 border-t border-yb-rule p-3">
        {wide && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-sm text-yb-paper">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-yb-ink">{user?.email}</div>
              <div className="text-[11px] text-yb-ink-muted">{roleLabel}</div>
            </div>
          </div>
        )}

        <button onClick={signOut}
          title={!wide ? 'Cerrar sesión' : undefined}
          className={`mt-1 flex w-full items-center gap-2.5 rounded-[3px] px-3 py-2 text-sm text-yb-ink-muted transition-colors hover:bg-white/60 hover:text-yb-ink ${!wide ? 'justify-center' : ''}`}>
          <LogOut size={15} strokeWidth={1.6} className="shrink-0" />
          {wide && 'Cerrar sesión'}
        </button>

        {!mobile && (
          <button onClick={onToggle}
            className={`flex w-full items-center gap-2 rounded-[3px] px-3 py-2 text-xs text-yb-ink-muted transition-colors hover:text-yb-ink ${collapsed ? 'justify-center' : ''}`}>
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Colapsar</span></>}
          </button>
        )}
      </div>
    </aside>
  );
};

// ── Layout principal ───────────────────────────────────────────────────────────
const Layout = () => {
  const { profile } = useAuth();
  if (profile?.role === 'student') return <StudentShell />;
  return <StaffLayout />;
};

const StaffLayout = () => {
  const location = useLocation();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const pageName = PAGE_NAMES[location.pathname] ?? '';

  return (
    <div className="flex min-h-screen bg-yb-paper font-yb-sans text-yb-ink">

      {/* Sidebar escritorio */}
      <div className={`fixed inset-y-0 left-0 z-40 hidden flex-col md:flex ${collapsed ? 'w-16' : 'w-60'} animate-yb-fade transition-all duration-200 motion-reduce:animate-none`}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      </div>

      {/* Sidebar móvil */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-yb-ink/30 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col shadow-xl md:hidden">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Contenido */}
      <div className={`flex min-w-0 flex-1 flex-col ${collapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-200`}>

        <header className="sticky top-0 z-30 border-b border-yb-rule bg-yb-paper/90 backdrop-blur">
          <div className="flex h-[68px] items-center gap-4 px-4 sm:px-8">
            <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú"
              className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-yb-rule text-yb-ink-muted hover:text-yb-ink md:hidden">
              <Menu size={17} />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-yb-ink-muted sm:block">Yuuban</span>
              {pageName && <>
                <span className="hidden text-yb-rule sm:block">/</span>
                <span className="truncate font-semibold text-yb-ink">{pageName}</span>
              </>}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div key={location.pathname} className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;
