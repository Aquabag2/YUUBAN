import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Calendar, Award, Megaphone, ArrowRight, ArrowUpRight,
  QrCode, ShieldCheck, BookOpen, GraduationCap, Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

/*
 * Dashboard — estilo sobrio: papel, tinta y un solo acento verde (yb-forest).
 * Animación de entrada: cada bloque sube y aparece en cascada (clase animate-yb-rise
 * + retraso), los números cuentan desde 0 y el filete bajo el saludo se dibuja.
 * Todo se desactiva con "reducir movimiento" del sistema.
 */

// ── Entrada en cascada ────────────────────────────────────────────────────────
const Rise = ({ i = 0, className = '', children, as: Tag = 'div' }) => (
  <Tag className={`animate-yb-rise motion-reduce:animate-none ${className}`} style={{ animationDelay: `${120 + i * 90}ms` }}>
    {children}
  </Tag>
);

// ── Número que cuenta desde 0 ─────────────────────────────────────────────────
const CountUp = ({ value }) => {
  const target = typeof value === 'number' ? value : null;
  const [n, setN] = useState(target === null ? value : 0);
  useEffect(() => {
    if (target === null) { setN(value); return; }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === 0) { setN(target); return; }
    let raf; const t0 = performance.now(); const dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, value]);
  return <>{n}</>;
};

// ── Dato (fila de cifras) ─────────────────────────────────────────────────────
const Figure = ({ label, value, note }) => (
  <div className="px-0 py-5 sm:px-6 sm:first:pl-0">
    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{label}</div>
    <div className="mt-2 font-yb-serif text-[40px] leading-none text-yb-ink">
      {value === null
        ? <span className="inline-block h-9 w-14 animate-pulse bg-yb-rule" />
        : <CountUp value={value} />}
    </div>
    {note && <div className="mt-2 text-xs text-yb-ink-muted">{note}</div>}
  </div>
);

// ── Acción (fila de lista) ────────────────────────────────────────────────────
const Action = ({ icon: Icon, label, desc, to, onClick, external }) => {
  const cls = 'group flex w-full items-center gap-5 border-b border-yb-rule py-5 text-left transition-colors hover:bg-white/70 sm:px-2';
  const Arrow = external ? ArrowUpRight : ArrowRight;
  const inner = (
    <>
      <Icon size={18} strokeWidth={1.6} className="shrink-0 text-yb-ink-muted transition-colors group-hover:text-yb-forest" />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-yb-ink">{label}</div>
        <div className="mt-0.5 text-sm text-yb-ink-muted">{desc}</div>
      </div>
      <Arrow size={16} className="shrink-0 text-yb-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-yb-ink" />
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};
const today = () => {
  const s = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const Header = ({ title, subtitle, action }) => (
  <header className="mb-10">
    <Rise i={0}>
      <p className="text-xs font-medium text-yb-ink-muted">{today()}</p>
    </Rise>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
      <Rise i={1}>
        <h1 className="font-yb-serif text-[44px] leading-[1.02] tracking-[-0.01em] text-yb-ink sm:text-[52px]">{title}</h1>
        <p className="mt-2 text-[15px] text-yb-ink-muted">{subtitle}</p>
      </Rise>
      {action && <Rise i={2}>{action}</Rise>}
    </div>
    <div className="mt-8 h-px origin-left animate-yb-line bg-yb-ink/80 motion-reduce:animate-none" />
  </header>
);

const SectionTitle = ({ children }) => (
  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{children}</h2>
);

// ── Dashboard principal ───────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, profile } = useAuth();
  const role         = profile?.role ?? 'admin';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin      = role === 'admin' || isSuperAdmin;

  const [event,   setEvent]   = useState(null);
  const [stats,   setStats]   = useState(null);
  const [clients, setClients] = useState(0);
  const [loading, setLoading] = useState(true);

  const firstName = user?.email?.split('@')[0] ?? 'Admin';

  useEffect(() => {
    const loads = [];
    if (isAdmin) {
      loads.push(
        api.get('/my-event').then(r => setEvent(Array.isArray(r.data) ? r.data[0] : r.data)).catch(() => {}),
        api.get('/stats').then(r => setStats(r.data)).catch(() => {}),
      );
    }
    if (isSuperAdmin) {
      loads.push(api.get('/super/clients').then(r => setClients(r.data?.length ?? 0)).catch(() => {}));
    }
    Promise.allSettled(loads).finally(() => setLoading(false));
  }, [isAdmin, isSuperAdmin]);

  // ── Vista estudiante ───────────────────────────────────────────────────────
  if (role === 'student') {
    return (
      <div className="font-yb-sans">
        <Header title={`${greeting()}, ${firstName}`} subtitle="Bienvenido a Yuuban." />
        <Rise i={3}>
          <SectionTitle>Accesos</SectionTitle>
          <div className="border-t border-yb-rule">
            <Action icon={BookOpen}      label="Cursos"          desc="Explora los eventos y festivales disponibles" to="/cursos" />
            <Action icon={GraduationCap} label="Mis clases"      desc="Tus inscripciones y horarios"                 to="/estudiante" />
            <Action icon={Trophy}        label="Mis concursos"   desc="Participaciones y resultados"                 to="/mis-concursos" />
            <Action icon={Megaphone}     label="Novedades"       desc="Anuncios, horarios y resultados de tu festival" to="/novedades" />
          </div>
        </Rise>
      </div>
    );
  }

  // ── Vista admin / super_admin ──────────────────────────────────────────────
  const inscritos = loading ? null : (typeof stats?.totalStudents === 'number' ? stats.totalStudents : (event ? '—' : 0));
  const estado    = loading ? null : (event?.is_published ? 'Publicado' : event ? 'Borrador' : 'Ninguno');

  return (
    <div className="font-yb-sans">
      <Header
        title={isSuperAdmin ? 'Panel Yuuban' : `${greeting()}, ${firstName}`}
        subtitle={isSuperAdmin
          ? 'Control general de la plataforma.'
          : event ? `Gestionando ${event.title}.` : 'Aún no tienes un evento. Empieza creando el primero.'}
        action={isAdmin && !loading && !event && (
          <Link to="/mi-evento"
            className="inline-flex items-center gap-2 rounded-[3px] bg-yb-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-yb-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yb-forest">
            <Plus size={15} /> Crear mi evento
          </Link>
        )}
      />

      {/* Cifras */}
      <Rise i={3} className="mb-12">
        <SectionTitle>Resumen</SectionTitle>
        <div className="grid grid-cols-1 divide-y divide-yb-rule border-y border-yb-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {isSuperAdmin && <Figure label="Clientes" value={loading ? null : clients} />}
          <Figure label="Inscritos" value={inscritos} note={event ? 'En tu evento actual' : 'Sin evento activo'} />
          <Figure label="Evento" value={estado} note={event?.date || (event ? 'Sin fecha' : '—')} />
          {!isSuperAdmin && <Figure label="Check-in" value={event?.slug ? 'Listo' : '—'} note={event?.slug ? 'Escáner disponible' : 'Disponible al crear evento'} />}
        </div>
      </Rise>

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        {/* Acciones */}
        <Rise i={4}>
          <SectionTitle>Acciones</SectionTitle>
          <div className="border-t border-yb-rule">
            {event
              ? <Action icon={Calendar} label="Gestionar mi evento" desc={`${event.title} · ${event.is_published ? 'Publicado' : 'Borrador'}`} to="/mi-evento" />
              : <Action icon={Plus}     label="Crear evento"        desc="Configura tu festival, clases o concurso" to="/mi-evento" />}
            <Action icon={Award}     label="Constancias"       desc="Diseña y genera diplomas para tus participantes" to="/admin" />
            <Action icon={Megaphone} label="Publicar novedad"  desc="Anuncia horarios, resultados o ganadores"        to="/novedades" />
            {event?.slug && (
              <Action icon={QrCode} label="Check-in del evento" desc="Escanea entradas QR en la puerta" external
                onClick={() => window.open(`/checkin/${event.slug}`, '_blank')} />
            )}
            {isSuperAdmin && (
              <Action icon={ShieldCheck} label="Panel de plataforma" desc="Clientes, eventos y configuración global" to="/super" />
            )}
          </div>
        </Rise>

        {/* Mi evento */}
        <Rise i={5}>
          <SectionTitle>Mi evento</SectionTitle>
          {event ? (
            <div className="border-t border-yb-rule pt-6">
              <div className="flex items-center gap-2 text-xs font-medium text-yb-ink-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${event.is_published ? 'bg-yb-forest' : 'bg-yb-ink-muted'}`} />
                {event.is_published ? 'Publicado' : 'Borrador'}
              </div>
              <h3 className="mt-3 font-yb-serif text-3xl leading-tight text-yb-ink">{event.title}</h3>
              <p className="mt-2 text-sm text-yb-ink-muted">
                {[event.location, event.date || 'Sin fecha'].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold">
                <Link to="/mi-evento" className="text-yb-ink underline decoration-1 underline-offset-4 hover:text-yb-forest">Ver detalles</Link>
                {event.slug && event.is_published && (
                  <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-yb-ink underline decoration-1 underline-offset-4 hover:text-yb-forest">
                    Página pública <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="border-t border-yb-rule pt-6">
              <p className="font-yb-serif text-2xl leading-snug text-yb-ink">Todavía no hay un evento.</p>
              <p className="mt-2 text-sm text-yb-ink-muted">Cuando lo crees, aquí verás su estado, fecha y enlace público.</p>
            </div>
          )}
        </Rise>
      </div>

      {isAdmin && (
        <Rise i={6} className="mt-16">
          <p className="flex items-center gap-2 border-t border-yb-rule pt-5 text-xs text-yb-ink-muted">
            <ShieldCheck size={13} strokeWidth={1.6} />
            Conexión cifrada (TLS) · Autenticación con Supabase · Datos protegidos con RLS
          </p>
        </Rise>
      )}
    </div>
  );
};

export default Dashboard;
