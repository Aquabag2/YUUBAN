import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Music2, LayoutDashboard, Users,
  ShieldCheck, LogOut, ChevronDown, GraduationCap,
  Megaphone, BookOpen, Home,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TABS_BY_ROLE = {
  student: [
    { to: '/dashboard', label: 'Dashboard',  icon: Home },
    { to: '/cursos',    label: 'Cursos',     icon: BookOpen },
    { to: '/estudiante',label: 'Mis Clases', icon: GraduationCap },
  ],
  admin: [
    { to: '/dashboard',  label: 'Dashboard',  icon: Home },
    { to: '/cursos',     label: 'Cursos',     icon: BookOpen },
    { to: '/admin',      label: 'Admin',      icon: LayoutDashboard },
    { to: '/mi-evento',  label: 'Mi Evento',  icon: Megaphone },
    { to: '/maestros',   label: 'Maestros',   icon: Users },
  ],
  super_admin: [
    { to: '/dashboard',  label: 'Dashboard',  icon: Home },
    { to: '/cursos',     label: 'Cursos',     icon: BookOpen },
    { to: '/admin',      label: 'Admin',      icon: LayoutDashboard },
    { to: '/mi-evento',  label: 'Mi Evento',  icon: Megaphone },
    { to: '/maestros',   label: 'Maestros',   icon: Users },
    { to: '/estudiante', label: 'Estudiante', icon: GraduationCap },
  ],
};

const ROLE_LABELS = { student: 'Estudiante', admin: 'Admin', super_admin: 'Super Admin' };
const ROLE_COLORS = {
  student:    'bg-emerald-100 text-emerald-700',
  admin:      'bg-violet-100 text-violet-700',
  super_admin:'bg-amber-100 text-amber-700',
};

const Layout = () => {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const role        = profile?.role ?? 'admin';
  const isSuperAdmin = role === 'super_admin';
  const tabs        = TABS_BY_ROLE[role] ?? TABS_BY_ROLE.admin;
  const initials    = user?.email?.charAt(0).toUpperCase() ?? '?';
  const roleLabel   = ROLE_LABELS[role] ?? role;
  const roleBadge   = ROLE_COLORS[role] ?? ROLE_COLORS.admin;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">

          {/* Logo */}
          <Link to="/dashboard"
            className="flex items-center gap-2.5 shrink-0 rounded-xl p-1 transition-opacity hover:opacity-75">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] shadow-lg shadow-violet-200">
              <Music2 size={17} className="text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">Yuuban</span>
          </Link>

          {/* Nav */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-0.5 rounded-2xl border border-gray-200 bg-gray-50 p-1">
              {tabs.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                      isActive
                        ? 'bg-[#7C3AED] text-white shadow-sm shadow-violet-200'
                        : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                    }`
                  }
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            {isSuperAdmin && (
              <>
                <div className="h-6 w-px shrink-0 bg-gray-200" />
                <NavLink to="/super"
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-amber-200 bg-amber-50/50 text-amber-600 hover:border-amber-300 hover:bg-amber-50'
                    }`
                  }
                >
                  <ShieldCheck size={14} />
                  <span className="hidden sm:inline">Super Admin</span>
                </NavLink>
              </>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div className="relative shrink-0">
            <button type="button" onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden max-w-[110px] truncate text-gray-600 sm:block">
                {user?.email}
              </span>
              <span className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:block ${roleBadge}`}>
                {roleLabel}
              </span>
              <ChevronDown size={13} className="text-gray-400" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl shadow-gray-100">
                  <div className="border-b border-gray-100 px-3 py-3">
                    <div className="truncate text-xs text-gray-500">{user?.email}</div>
                    <div className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge}`}>
                      {roleLabel}
                    </div>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      <Home size={14} /> Dashboard
                    </Link>
                    <button type="button" onClick={() => { signOut(); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
