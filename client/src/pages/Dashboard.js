import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, Users, Award, Megaphone,
  ArrowRight, Globe, Lock, QrCode, ShieldCheck,
  TrendingUp, CheckCircle2, FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

// ── Tarjeta de acción rápida ──────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, desc, to, onClick, color = 'violet', accent }) => {
  const colors = {
    violet: 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100',
    emerald:'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100',
    sky:    'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100',
  };
  const cls = `flex items-start gap-4 rounded-2xl border p-5 transition-all cursor-pointer group ${colors[color]}`;
  const inner = (
    <>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border ${
        color === 'violet' ? 'border-violet-200' :
        color === 'emerald'? 'border-emerald-200' :
        color === 'amber'  ? 'border-amber-200' : 'border-sky-200'
      }`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-gray-900 text-sm">{label}</div>
        <div className="mt-0.5 text-xs text-gray-500 leading-relaxed">{desc}</div>
      </div>
      <ArrowRight size={16} className="shrink-0 text-gray-300 group-hover:text-gray-500 mt-1 transition-colors" />
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <div className={cls} onClick={onClick}>{inner}</div>;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const Stat = ({ label, value, icon: Icon, color }) => {
  const c = {
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', icon: 'text-violet-400' },
    emerald:{ bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'text-emerald-400' },
    amber:  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'text-amber-400' },
    sky:    { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', icon: 'text-sky-400' },
  }[color] ?? {};
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} px-5 py-4`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <Icon size={15} className={c.icon} />
      </div>
      <div className={`mt-2 text-2xl font-bold ${c.text}`}>
        {value ?? <span className="inline-block h-7 w-12 animate-pulse rounded-lg bg-white/60" />}
      </div>
    </div>
  );
};

// ── Dashboard principal ───────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate  = useNavigate();
  const role      = profile?.role ?? 'admin';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin   = role === 'admin' || isSuperAdmin;

  const [event,    setEvent]    = useState(null);
  const [stats,    setStats]    = useState(null);
  const [clients,  setClients]  = useState(0);
  const [loading,  setLoading]  = useState(true);

  const firstName = user?.email?.split('@')[0] ?? 'Admin';

  useEffect(() => {
    const loads = [];

    if (isAdmin) {
      loads.push(
        api.get('/my-event').then(r => setEvent(r.data)).catch(() => {}),
        api.get('/stats').then(r => setStats(r.data)).catch(() => {}),
      );
    }

    if (isSuperAdmin) {
      loads.push(
        api.get('/super/clients').then(r => setClients(r.data?.length ?? 0)).catch(() => {}),
      );
    }

    Promise.allSettled(loads).finally(() => setLoading(false));
  }, [isAdmin, isSuperAdmin]);

  // ── Vista estudiante ───────────────────────────────────────────────────────
  if (role === 'student') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-gray-500">Bienvenido a Yuuban — tu plataforma de festivales.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickAction icon={Calendar} label="Ver Cursos" desc="Explora los eventos y festivales disponibles" to="/cursos" color="violet" />
          <QuickAction icon={Megaphone} label="Novedades" desc="Anuncios, horarios y resultados de tu festival" to="/novedades" color="emerald" />
          <QuickAction icon={Award} label="Mis Constancias" desc="Descarga tus diplomas y certificados" to="/estudiante" color="amber" />
        </div>
      </div>
    );
  }

  // ── Vista admin / super_admin ──────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header de bienvenida */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSuperAdmin ? `Panel Yuuban` : `Hola, ${firstName}`}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isSuperAdmin
              ? 'Control total de la plataforma'
              : event ? `Gestionando: ${event.title}` : 'Crea tu primer evento para empezar'}
          </p>
        </div>
        {isAdmin && !loading && !event && (
          <Link to="/mi-evento"
            className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors shadow-sm shadow-violet-200">
            <Plus size={15} /> Crear mi evento
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin && (
          <Stat label="Clientes" value={loading ? null : clients} icon={Users} color="violet" />
        )}
        <Stat
          label="Inscritos"
          value={loading ? null : (stats?.totalStudents ?? (event ? '—' : '0'))}
          icon={Users} color={isSuperAdmin ? 'emerald' : 'violet'}
        />
        <Stat
          label="Evento activo"
          value={loading ? null : (event?.is_published ? 'Sí' : event ? 'Borrador' : 'Ninguno')}
          icon={Globe} color="amber"
        />
        <Stat
          label="Seguridad"
          value="TLS ✓"
          icon={ShieldCheck} color="sky"
        />
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Acciones rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2">

          {/* Evento */}
          {event ? (
            <QuickAction
              icon={Calendar}
              label="Gestionar mi evento"
              desc={`${event.title} · ${event.is_published ? 'Publicado' : 'Borrador'}`}
              to="/mi-evento"
              color="violet"
            />
          ) : (
            <QuickAction
              icon={Plus}
              label="Crear evento"
              desc="Configura tu festival, clases o concurso"
              to="/mi-evento"
              color="violet"
            />
          )}

          {/* Constancias */}
          <QuickAction
            icon={Award}
            label="Constancias"
            desc="Diseña y genera diplomas para tus participantes"
            to="/admin"
            color="amber"
          />

          {/* Novedades */}
          <QuickAction
            icon={Megaphone}
            label="Publicar novedad"
            desc="Anuncia horarios, resultados o ganadores"
            to="/novedades"
            color="emerald"
          />

          {/* Check-in */}
          {event?.slug && (
            <QuickAction
              icon={QrCode}
              label="Check-in del evento"
              desc="Escanea entradas QR en la puerta"
              onClick={() => window.open(`/checkin/${event.slug}`, '_blank')}
              color="sky"
            />
          )}

          {/* Super Admin */}
          {isSuperAdmin && (
            <QuickAction
              icon={ShieldCheck}
              label="Panel de plataforma"
              desc="Gestiona clientes, eventos y configuración global"
              to="/super"
              color="amber"
            />
          )}
        </div>
      </div>

      {/* Estado del evento */}
      {event && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Calendar size={15} className="text-violet-500" /> Mi evento
            </h3>
            <Link to="/mi-evento"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Ver detalles <ArrowRight size={11} />
            </Link>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                event.is_published ? 'bg-emerald-50' : 'bg-gray-100'
              }`}>
                {event.is_published ? <Globe size={20} className="text-emerald-600" /> : <Lock size={20} className="text-gray-400" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{event.title}</div>
                <div className="mt-0.5 text-sm text-gray-500">
                  {event.location && `${event.location} · `}
                  {event.date || 'Sin fecha'}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  event.is_published
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}>
                  {event.is_published ? '● Publicado' : '○ Borrador'}
                </span>
                {event.slug && event.is_published && (
                  <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                    Ver página
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seguridad — info para el admin */}
      {isAdmin && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-emerald-800">Plataforma segura</div>
              <div className="mt-1 text-xs text-emerald-700 leading-relaxed">
                Cifrado TLS en tránsito · Autenticación JWT con Supabase · Rate limiting activo ·
                Cabeceras de seguridad HTTP (Helmet) · Datos en PostgreSQL con RLS
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
