import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Music2, Palette, GraduationCap, Trophy, QrCode, MapPin } from 'lucide-react';

/*
 * Landing pública de Yuuban — dirección "selva + clarinete viejo".
 * Paleta y tipografía viven en tailwind.config.js (colores `yb-*`, fuentes `font-yb-serif` / `font-yb-sans`).
 * <HeroArt /> es provisional: cuando llegue el logo, reemplázalo por
 *   <img src="/logo.png" alt="Yuuban" className="w-full" />
 */

const TICKER = ['Música en vivo', 'Arte', 'Clases', 'Concursos', 'Xalapa, Veracruz', 'Boleto digital QR'];

const STEPS = [
  { n: '01', title: 'Regístrate', desc: 'Crea tu cuenta en un minuto y elige cómo quieres participar en el festival.' },
  { n: '02', title: 'Recibe tu boleto', desc: 'Te llega un código QR único a tu correo. No necesitas imprimir nada.' },
  { n: '03', title: 'Llega y disfruta', desc: 'Muestra tu QR en la entrada, pasas en segundos y el resto es música.' },
];

const FACTS = [
  { k: 'Lugar', v: 'Xalapa, Veracruz' },
  { k: 'Fecha', v: 'Por anunciar' },
  { k: 'Entrada', v: 'Boleto digital QR' },
  { k: 'Ambiente', v: 'Música en vivo y arte' },
];

/* Aparece suavemente al entrar en pantalla */
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}>
      {children}
    </div>
  );
};

/* Ilustración provisional (clarinete + hojas). Se reemplaza por el logo. */
const HeroArt = () => (
  <svg viewBox="0 0 440 520" className="h-auto w-full" role="img" aria-label="Yuuban: clarinete de madera con anillos de latón entre hojas">
    <rect x="80" y="0" width="360" height="520" className="fill-yb-selva" />
    <path d="M80 520 L80 250 A270 270 0 0 1 350 520 Z" className="fill-yb-helecho" />
    <circle cx="160" cy="110" r="46" className="fill-yb-laton" />
    <rect x="252" y="16" width="68" height="440" className="fill-yb-madera" />
    <path d="M252 440 H320 L346 504 H226 Z" className="fill-yb-madera" />
    <rect x="252" y="86" width="68" height="8" className="fill-yb-laton" />
    <rect x="252" y="262" width="68" height="8" className="fill-yb-laton" />
    <rect x="226" y="498" width="120" height="6" className="fill-yb-laton" />
    {[136, 176, 216, 316, 356, 396].map((y) => (
      <circle key={y} cx="286" cy={y} r="11" className="fill-yb-bg" />
    ))}
  </svg>
);

const PrimaryBtn = ({ to, children, className = '' }) => (
  <Link to={to}
    className={`group inline-flex items-center gap-2 rounded-[2px] bg-yb-helecho px-6 py-4 text-[15px] font-semibold leading-5 text-yb-bg transition-all hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yb-laton ${className}`}>
    {children}
    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
  </Link>
);

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-yb-bg font-yb-sans text-yb-text antialiased selection:bg-yb-helecho selection:text-yb-bg">

      {/* ── Nav ── */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled ? 'border-b border-yb-line bg-yb-bg/85 backdrop-blur-md' : 'border-b border-transparent'}`}>
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-10">
          <Link to="/" className="font-yb-serif text-[28px] leading-none tracking-tight">Yuuban</Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <a href="#como-funciona" className="hidden text-yb-muted transition-colors hover:text-yb-text md:inline">Cómo funciona</a>
            <a href="#experiencia" className="hidden text-yb-muted transition-colors hover:text-yb-text md:inline">Experiencia</a>
            <Link to="/login" className="text-yb-muted transition-colors hover:text-yb-text">Iniciar sesión</Link>
            <Link to="/login?modo=registro" className="rounded-[2px] bg-yb-helecho px-4 py-2.5 font-semibold text-yb-bg transition hover:brightness-105">Boletos</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="mx-auto max-w-7xl px-5 pt-32 md:px-10 md:pt-40">
        <div className="grid items-end gap-12 lg:grid-cols-[1.45fr_0.8fr] lg:gap-16">
          <div>
            <Reveal>
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.16em] text-yb-laton">
                Xalapa · Veracruz — Edición 01
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-yb-serif text-[56px] font-normal leading-[0.95] tracking-[-0.015em] sm:text-[76px] lg:text-[104px]">
                Únete al festival <em className="text-yb-helecho">Yuuban</em> en Xalapa.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-yb-muted md:text-[19px]">
                Música en vivo y arte bajo el mismo cielo. Consigue tu boleto, recíbelo con código QR y entra sin filas.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <PrimaryBtn to="/login?modo=registro">Conseguir mi boleto</PrimaryBtn>
                <a href="#como-funciona" className="text-[15px] font-semibold underline decoration-1 underline-offset-[6px] transition-colors hover:text-yb-helecho">
                  Ver cómo funciona →
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="mx-auto w-full max-w-sm lg:max-w-none">
            <HeroArt />
          </Reveal>
        </div>

        {/* Datos */}
        <dl className="mt-16 grid grid-cols-2 border-t border-yb-line md:mt-20 md:grid-cols-4">
          {FACTS.map(({ k, v }, i) => (
            <div key={k} className={`py-6 pr-4 ${i % 2 ? 'border-l border-yb-line pl-4 md:pl-6' : ''} ${i === 2 ? 'border-t border-yb-line md:border-l md:border-t-0 md:pl-6' : ''} ${i === 3 ? 'border-t md:border-t-0' : ''}`}>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-yb-muted">{k}</dt>
              <dd className="mt-2 font-yb-serif text-2xl leading-tight md:text-[26px]">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* ── Ticker ── */}
      <div className="mt-6 overflow-hidden border-y border-yb-line py-5" aria-hidden="true">
        <div className="flex w-max animate-[ticker_40s_linear_infinite] whitespace-nowrap motion-reduce:animate-none">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center font-yb-serif text-3xl italic text-yb-text/90 md:text-4xl">
              <span className="px-8">{t}</span>
              <span className="h-2 w-2 rounded-full bg-yb-laton" />
            </span>
          ))}
        </div>
      </div>

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.6fr] lg:gap-20">
          <Reveal>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-yb-laton">Cómo funciona</p>
            <h2 className="font-yb-serif text-5xl leading-[1] tracking-tight md:text-[64px]">
              Tres pasos y <em className="text-yb-helecho">estás dentro.</em>
            </h2>
          </Reveal>

          <ol className="border-t border-yb-line">
            {STEPS.map(({ n, title, desc }, i) => (
              <Reveal key={n} delay={i * 100}>
                <li className="group grid grid-cols-[64px_1fr] gap-4 border-b border-yb-line py-8 md:grid-cols-[96px_1fr_1.2fr] md:items-baseline md:gap-8">
                  <span className="font-yb-serif text-4xl text-yb-laton md:text-5xl">{n}</span>
                  <h3 className="font-yb-serif text-3xl leading-tight transition-colors group-hover:text-yb-helecho">{title}</h3>
                  <p className="col-start-2 text-base leading-relaxed text-yb-muted md:col-start-auto">{desc}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Experiencia (bento) ── */}
      <section id="experiencia" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-24 md:px-10 md:pb-32">
        <Reveal>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-yb-laton">La experiencia</p>
          <h2 className="max-w-3xl font-yb-serif text-5xl leading-[1] tracking-tight md:text-[64px]">
            Un festival para escuchar, aprender y crear.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-3 md:grid-cols-6 md:grid-rows-[220px_220px]">
          <Reveal className="md:col-span-3 md:row-span-2">
            <div className="flex h-full min-h-[280px] flex-col justify-between bg-yb-selva p-8 md:p-10">
              <Music2 size={28} className="text-yb-helecho" />
              <div>
                <h3 className="font-yb-serif text-4xl leading-tight md:text-5xl">Música en vivo</h3>
                <p className="mt-3 max-w-sm text-yb-text/80">Conciertos y presentaciones durante todo el festival.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={80} className="md:col-span-3">
            <div className="flex h-full min-h-[200px] flex-col justify-between bg-yb-raised p-8">
              <Palette size={24} className="text-yb-laton" />
              <div>
                <h3 className="font-yb-serif text-3xl">Arte</h3>
                <p className="mt-2 text-sm text-yb-muted">Arte visual y escénico en el mismo espacio que la música.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={140} className="md:col-span-2">
            <div className="flex h-full min-h-[200px] flex-col justify-between bg-yb-raised p-8">
              <GraduationCap size={24} className="text-yb-laton" />
              <div>
                <h3 className="font-yb-serif text-3xl">Clases</h3>
                <p className="mt-2 text-sm text-yb-muted">Aprende con maestros del festival.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={200} className="md:col-span-1">
            <div className="flex h-full min-h-[200px] flex-col justify-between bg-yb-helecho p-6 text-yb-bg">
              <Trophy size={22} />
              <h3 className="font-yb-serif text-2xl leading-tight">Concursos</h3>
            </div>
          </Reveal>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Reveal>
            <div className="flex items-center gap-5 border border-yb-line p-6">
              <QrCode size={22} className="shrink-0 text-yb-helecho" />
              <p className="text-yb-muted"><span className="font-semibold text-yb-text">Boleto digital.</span> Tu QR llega al correo y se escanea en la entrada.</p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="flex items-center gap-5 border border-yb-line p-6">
              <MapPin size={22} className="shrink-0 text-yb-helecho" />
              <p className="text-yb-muted"><span className="font-semibold text-yb-text">En Xalapa.</span> La sede exacta se anunciará pronto.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="border-t border-yb-line">
        <div className="mx-auto grid max-w-7xl items-end gap-10 px-5 py-24 md:grid-cols-[1.5fr_1fr] md:px-10 md:py-32">
          <Reveal>
            <h2 className="font-yb-serif text-[56px] leading-[0.95] tracking-tight md:text-[96px]">
              Nos vemos en <em className="text-yb-helecho">Xalapa.</em>
            </h2>
          </Reveal>
          <Reveal delay={120} className="md:justify-self-end">
            <p className="mb-8 max-w-xs text-yb-muted">Asegura tu lugar hoy. Tu boleto llega al instante a tu correo.</p>
            <PrimaryBtn to="/login?modo=registro">Conseguir mi boleto</PrimaryBtn>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-yb-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-10">
          <span className="font-yb-serif text-5xl leading-none tracking-tight md:text-7xl">Yuuban</span>
          <div className="flex flex-col gap-2 text-sm text-yb-muted md:items-end">
            <Link to="/login" className="inline-flex items-center gap-1 transition-colors hover:text-yb-text">
              Acceso organizadores <ArrowUpRight size={14} />
            </Link>
            <span>© {new Date().getFullYear()} Festival Yuuban · Xalapa, Veracruz</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
