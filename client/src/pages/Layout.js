import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Music2, LayoutDashboard, Users, ShieldCheck, LogOut,
  GraduationCap, Megaphone, BookOpen, Home, ChevronLeft,
  ChevronRight, Calendar, Award, Menu, X, Lock,
} from 'lucide-react';

// ── Navegación por rol ────────────────────────────────────────────────────────
const NAV = {
  student: [
    { section: 'Principal' },
    { to: '/dashboard',  label: 'Dashboard',   icon: Home },
    { to: '/novedades',  label: 'Novedades',   icon: Megaphone },
    { section: 'Aprendizaje' },
    { to: '/cursos',     label: 'Cursos',      icon: BookOpen },
    { to: '/estudiante', label: 'Mis Clases',  icon: GraduationCap },
  ],
  admin: [
    { section: 'Principal' },
    { to: '/dashboard',  label: 'Dashboard',   icon: Home },
    { section: 'Gestión' },
    { to: '/admin',      label: 'Panel Admin', icon: LayoutDashboard },
    { to: '/mi-evento',  label: 'Mi Evento',   icon: Calendar },
    { to: '/maestros',   label: 'Maestros',    icon: Users },
    { section: 'Comunidad' },
    { to: '/novedades',  label: 'Novedades',   icon: Megaphone },
    { to: '/cursos',     label: 'Cursos',      icon: BookOpen },
  ],
  super_admin: [
    { section: 'Principal' },
    { to: '/dashboard',  label: 'Dashboard',   icon: Home },
    { section: 'Super Admin' },
    { to: '/super',      label: 'Plataforma',  icon: ShieldCheck, accent: true },
    { section: 'Gestión' },
    { to: '/admin',      label: 'Panel Admin', icon: LayoutDashboard },
    { to: '/mi-evento',  label: 'Mi Evento',   icon: Calendar },
    { to: '/maestros',   label: 'Maestros',    icon: Users },
    { section: 'Comunidad' },
    { to: '/novedades',  label: 'Novedades',   icon: Megaphone },
    { to: '/cursos',     label: 'Cursos',      icon: BookOpen },
  ],
};

const ROLE_LABELS = {
  student:     'Estudiante',
  admin:       'Administrador',
  super_admin: 'Super Admin',
};
const ROLE_COLORS = {
  student:     'bg-emerald-100 text-emerald-700',
  admin:       'bg-violet-100 text-violet-700',
  super_admin: 'bg-amber-100 text-amber-700',
};

// ── Nombre de la página actual ─────────────────────────────────────────────────
const PAGE_NAMES = {
  '/dashboard':  'Dashboard',
  '/admin':      'Panel Admin',
  '/mi-evento':  'Mi Evento',
  '/maestros':   'Maestros',
  '/novedades':  'Novedades',
  '/cursos':     'Cursos',
  '/estudiante': 'Mis Clases',
  '/super':      'Plataforma',
  '/flujo':      'Flujo',
};

// ── Sidebar ────────────────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle, onClose, mobile }) => {
  const { user, profile, signOut } = useAuth();
  const role    = profile?.role ?? 'admin';
  const items   = NAV[role] ?? NAV.admin;
  const initials = user?.email?.charAt(0).toUpperCase() ?? '?';
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleBadge = ROLE_COLORS[role] ?? ROLE_COLORS.admin;

  return (
    <aside className={`
      flex flex-col h-full bg-white border-r border-gray-200
      ${collapsed && !mobile ? 'w-16' : 'w-60'}
      transition-all duration-200
    `}>

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0 ${collapsed && !mobile ? 'justify-center px-0' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] shadow-md shadow-violet-200">
          <Music2 size={17} className="text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight text-gray-900">Yuuban</div>
            <div className="text-[10px] text-gray-400 font-medium">Festival Platform</div>
          </div>
        )}
        {mobile && (
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.map((item, i) => {
          if (item.section) {
            if (collapsed && !mobile) return null;
            return (
              <div key={i} className="px-3 pt-4 pb-1">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {item.section}
                </div>
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to}
              onClick={mobile ? onClose : undefined}
              title={collapsed && !mobile ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                ${collapsed && !mobile ? 'justify-center px-0 mx-1' : ''}
                ${isActive
                  ? item.accent
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-[#7C3AED] text-white shadow-sm shadow-violet-200'
                  : item.accent
                    ? 'text-amber-600 hover:bg-amber-50'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User + seguridad + cerrar sesión */}
      <div className="shrink-0 border-t border-gray-100 p-2 space-y-1">

        {/* Seguridad — solo visible expanded */}
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 font-medium">
            <Lock size={12} className="shrink-0" />
            Sesión cifrada TLS
          </div>
        )}

        {/* Info usuario */}
        {(!collapsed || mobile) && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-gray-700">{user?.email}</div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadge}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        <button onClick={signOut}
          title={collapsed && !mobile ? 'Cerrar sesión' : undefined}
          className={`flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <LogOut size={15} className="shrink-0" />
          {(!collapsed || mobile) && 'Cerrar sesión'}
        </button>

        {/* Toggle colapsar — solo desktop */}
        {!mobile && (
          <button onClick={onToggle}
            className={`flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs text-gray-400 hover:bg-gray-100 transition-colors ${collapsed ? 'justify-center' : ''}`}>
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Colapsar</span></>}
          </button>
        )}
      </div>
    </aside>
  );
};

// ── Layout principal ───────────────────────────────────────────────────────────
const Layout = () => {
  const location = useLocation();
  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  // Cerrar menú móvil al cambiar ruta
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const pageName = PAGE_NAMES[location.pathname] ?? '';

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">

      {/* ── Sidebar desktop (fixed) ── */}
      <div className={`
        hidden md:flex fixed inset-y-0 left-0 z-40 flex-col
        ${collapsed ? 'w-16' : 'w-60'}
        transition-all duration-200 shadow-sm
      `}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      </div>

      {/* ── Sidebar móvil (overlay) ── */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col shadow-2xl md:hidden">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* ── Contenido principal ── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${collapsed ? 'md:ml-16' : 'md:ml-60'}
        transition-all duration-200
      `}>

        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-4 px-4 py-3 sm:px-6">

            {/* Hamburger móvil */}
            <button onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 md:hidden transition-colors">
              <Menu size={17} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-400 hidden sm:block">Yuuban</span>
              {pageName && <>
                <span className="text-xs text-gray-300 hidden sm:block">/</span>
                <span className="text-sm font-semibold text-gray-700 truncate">{pageName}</span>
              </>}
            </div>

            {/* Espaciador */}
            <div className="flex-1" />

            {/* Seguridad badge — desktop */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <Lock size={11} />
              Seguro
            </div>

          </div>
        </header>

        {/* Página */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;
