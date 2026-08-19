import { Link } from 'react-router-dom';
import { ArrowRight, Zap, QrCode, CreditCard, BarChart3, Users, Calendar } from 'lucide-react';

const TICKER_ITEMS = [
  'Inscripciones en tiempo real',
  'Tickets QR únicos por asistente',
  'Pagos seguros con Stripe',
  'Check-in con cámara',
  'Panel del festival en minutos',
  'Correos automáticos de confirmación',
  'Exportación de lista en Excel',
  'Multi-festival desde un solo panel',
];

const FEATURES = [
  { icon: QrCode,      title: 'Tickets QR',         desc: 'Cada inscripción genera un código único. El staff escanea desde el celular para validar.' },
  { icon: CreditCard,  title: 'Pagos integrados',    desc: 'Cobra la inscripción con tarjeta vía Stripe. El dinero llega directo a tu cuenta.' },
  { icon: Users,       title: 'Check-in inteligente',desc: 'Lista en vivo de asistentes. Verde = entró, rojo = pendiente. Sin papel, sin caos.' },
  { icon: Calendar,    title: 'Tu página en minutos',desc: 'Crea la página pública de tu festival con programa, fechas y formulario de registro.' },
  { icon: BarChart3,   title: 'Panel de control',    desc: 'Ve quién se inscribió, cuánto pagó y exporta la lista en Excel con un clic.' },
  { icon: Zap,         title: 'Correos automáticos', desc: 'Al inscribirse, el asistente recibe su ticket por correo. Sin hacer nada tú.' },
];

const Landing = () => (
  <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

    {/* ── Nav ── */}
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#080c14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <span className="text-sm font-black text-white">Y</span>
          </div>
          <span className="text-lg font-black tracking-tight">Yuuban</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors">
            Iniciar sesión
          </Link>
          <Link to="/login"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#080c14] hover:bg-white/90 transition-colors">
            Empieza gratis
          </Link>
        </div>
      </div>
    </nav>

    {/* ── Hero ── */}
    <section className="relative flex min-h-screen flex-col items-start justify-end px-6 pb-20 pt-32 md:px-16">

      {/* Fondo con gradientes animados */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-20%] top-[-10%] h-[70vh] w-[70vh] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[50vh] w-[50vh] rounded-full bg-indigo-600/15 blur-[100px]" />
        <div className="absolute bottom-0 left-[30%] h-[40vh] w-[60vh] rounded-full bg-violet-900/20 blur-[100px]" />
        {/* Grid sutil */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative max-w-5xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-medium text-violet-300">Plataforma de festivales musicales</span>
        </div>

        <h1 className="text-6xl font-black leading-[0.95] tracking-tight md:text-8xl lg:text-[108px]">
          Organiza tu<br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-300 bg-clip-text text-transparent">
            festival.
          </span><br />
          Sin el caos.
        </h1>

        <p className="mt-8 max-w-xl text-lg text-white/40 leading-relaxed md:text-xl">
          Inscripciones, tickets QR, pagos con tarjeta y check-in en tiempo real.
          Todo en un panel que cualquier organizador puede usar el mismo día.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/login"
            className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#080c14] hover:bg-violet-100 transition-all">
            Crea tu festival gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <a href="#como-funciona"
            className="flex items-center gap-2 rounded-full border border-white/10 px-7 py-3.5 text-base font-medium text-white/60 hover:border-white/20 hover:text-white transition-all">
            Ver cómo funciona
          </a>
        </div>
      </div>

      {/* Número hero */}
      <div className="relative mt-20 flex flex-wrap gap-12">
        {[
          { n: '< 5 min', label: 'para publicar tu evento' },
          { n: '100%',    label: 'sin papel ni planillas' },
          { n: '0 MXN',   label: 'para empezar' },
        ].map(({ n, label }) => (
          <div key={label}>
            <div className="text-3xl font-black text-white md:text-4xl">{n}</div>
            <div className="mt-1 text-sm text-white/30">{label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── Ticker ── */}
    <div className="border-y border-white/5 bg-violet-600 py-4 overflow-hidden">
      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="mx-8 text-sm font-semibold uppercase tracking-widest text-white/90">
            {item} <span className="mx-4 text-violet-300">✦</span>
          </span>
        ))}
      </div>
    </div>

    {/* ── Cómo funciona ── */}
    <section id="como-funciona" className="mx-auto max-w-6xl px-6 py-32 md:px-16">
      <div className="mb-16">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Cómo funciona</div>
        <h2 className="text-4xl font-black tracking-tight md:text-6xl">
          De cero a festival<br />en minutos.
        </h2>
      </div>

      <div className="grid gap-px bg-white/5 md:grid-cols-3">
        {[
          { n: '01', title: 'Crea tu página', desc: 'Llena nombre, fecha, lugar y precio. Tu evento tiene URL pública en segundos.' },
          { n: '02', title: 'La gente se inscribe', desc: 'Formulario integrado. Para eventos de pago, Stripe procesa la tarjeta al instante.' },
          { n: '03', title: 'Llega el día del evento', desc: 'Escanea tickets QR desde el celular. Lista en vivo de quién ya entró.' },
        ].map(({ n, title, desc }) => (
          <div key={n} className="bg-[#080c14] p-8 md:p-10">
            <div className="mb-6 text-5xl font-black text-white/5">{n}</div>
            <div className="text-xl font-bold text-white">{title}</div>
            <div className="mt-3 text-sm leading-relaxed text-white/40">{desc}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── Features ── */}
    <section className="mx-auto max-w-6xl px-6 pb-32 md:px-16">
      <div className="mb-16">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Todo incluido</div>
        <h2 className="text-4xl font-black tracking-tight md:text-5xl">
          Lo que necesitas.<br />Nada que sobra.
        </h2>
      </div>

      <div className="grid gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="group bg-[#080c14] p-8 transition-colors hover:bg-[#0d1220]">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Icon size={18} className="text-violet-400" />
            </div>
            <div className="text-base font-bold text-white">{title}</div>
            <div className="mt-2 text-sm leading-relaxed text-white/40">{desc}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── CTA final ── */}
    <section className="mx-6 mb-20 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 md:mx-16">
      <div className="relative px-10 py-20 text-center md:px-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">
            Tu festival merece<br />mejor organización.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-white/70">
            Empieza hoy. Sin tarjeta de crédito, sin instalaciones, sin complicaciones.
          </p>
          <Link to="/login"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet-700 hover:bg-violet-50 transition-all">
            Crear mi cuenta gratis <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer className="border-t border-white/5 px-6 py-10 md:px-16">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-600">
            <span className="text-xs font-black">Y</span>
          </div>
          <span className="text-sm font-bold text-white/60">Yuuban</span>
        </div>
        <div className="text-xs text-white/20">
          © 2026 Yuuban. Hecho para festivales que importan.
        </div>
      </div>
    </footer>

  </div>
);

export default Landing;
