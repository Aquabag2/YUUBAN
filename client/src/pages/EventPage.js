import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, CheckCircle2, Share2, Ticket, CreditCard, XCircle, ChevronRight, Check, Eye, Smartphone, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useOverview, invalidateOverview } from '../components/StudentPanel';
import { isEmbedded } from '../lib/preview';

const EMPTY_FORM = { name:'' };
const fmtPrice = (c) => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0}).format(c/100);

const inputCls = 'w-full rounded-[3px] border border-yb-rule bg-white px-3.5 py-3 text-[15px] text-yb-ink placeholder-yb-ink-muted outline-none transition focus:border-yb-ink';
const primaryBtn = 'flex w-full items-center justify-center gap-2 rounded-[3px] bg-yb-forest py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-yb-ink disabled:opacity-60';
const initialsOf = (t = '') => t.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'Y';

// ── Selector de tipo de participación ─────────────────────────────────────────
const TypeSelector = ({ types, selected, onSelect }) => (
  <div>
    <h2 className="font-yb-serif text-[30px] leading-tight">¿Cómo participas?</h2>
    <p className="mt-1 text-sm text-yb-ink-muted">Elige tu tipo de participación.</p>
    <div className="mt-5 border-t border-yb-rule">
      {types.map((t) => {
        const on = selected?.id === t.id;
        return (
          <button key={t.id} type="button" onClick={() => onSelect(t)}
            className={`flex w-full items-center gap-4 border-b border-yb-rule px-1 py-4 text-left transition-colors ${on ? 'bg-white' : 'hover:bg-white/60'}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? 'border-yb-forest bg-yb-forest text-white' : 'border-yb-ink-muted'}`}>
              {on && <Check size={12} strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{t.name}</span>
              {t.description && <span className="mt-0.5 block text-sm leading-relaxed text-yb-ink-muted">{t.description}</span>}
              {t.capacity && <span className="mt-0.5 block text-xs text-yb-ink-muted">{t.capacity} lugares</span>}
            </span>
            <span className="shrink-0 font-yb-serif text-xl">{t.price_cents === 0 ? 'Gratis' : fmtPrice(t.price_cents)}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const EventPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [event,       setEvent]       = useState(null);
  const [schedule,    setSchedule]    = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);

  const { user } = useAuth();
  const [form,        setForm]        = useState(() => ({ ...EMPTY_FORM, name: user?.user_metadata?.full_name ?? '' }));
  const [submitting,  setSubmitting]  = useState(false);
  const [ticketUrl,   setTicketUrl]   = useState('');
  const [done,        setDone]        = useState(false);

  // Si ya tiene boleto para este evento, se muestra directo (no se vuelve a inscribir)
  const overview = useOverview();
  useEffect(() => {
    const mine = overview?.tickets?.find((t) => t.event.slug === slug);
    if (mine) { setTicketUrl(`/ticket/${mine.ticket_token}`); setDone(true); }
  }, [overview, slug]);
  const [formError,   setFormError]   = useState('');

  // Tipo seleccionado
  const [selectedType,  setSelectedType]  = useState(null);
  const [typeConfirmed, setTypeConfirmed] = useState(false);

  // Stripe
  const paymentParam = searchParams.get('payment');
  const sessionId    = searchParams.get('session_id');
  const [paymentMsg,  setPaymentMsg]  = useState('');
  const [confirming,  setConfirming]  = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/e/${slug}`),
      api.get(`/e/${slug}/schedule`).catch(() => ({ data: [] })),
      api.get(`/e/${slug}/ticket-types`).catch(() => ({ data: [] })),
    ])
      .then(([evRes, schRes, ttRes]) => {
        setEvent(evRes.data);
        setSchedule(schRes.data ?? []);
        setTicketTypes(ttRes.data ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (paymentParam === 'cancelled') { setPaymentMsg('cancelled'); return; }
    if (paymentParam === 'success' && sessionId) {
      setConfirming(true);
      api.post(`/e/${slug}/confirm-payment`, { session_id: sessionId })
        .then(() => { invalidateOverview(); navigate(`/dashboard?bienvenida=${encodeURIComponent(slug)}`); })
        .catch(err => setFormError(err.response?.data?.error ?? 'Error al confirmar el pago.'))
        .finally(() => setConfirming(false));
    }
  }, [paymentParam, sessionId, slug, navigate]);

  // Precio efectivo = ticket type si hay, si no evento
  const hasTypes   = ticketTypes.length > 0;
  const activeType = selectedType;
  const effectivePrice = hasTypes
    ? (activeType?.price_cents ?? 0)
    : (event?.price_cents ?? 0);
  const isPaid = effectivePrice > 0;

  // Mostrar form: si no hay tipos, siempre; si hay tipos, solo después de confirmar
  const showForm = !hasTypes || (hasTypes && selectedType && typeConfirmed);

  const handleSelectType = (t) => {
    setSelectedType(t);
    setTypeConfirmed(false);
  };

  const handleConfirmType = () => setTypeConfirmed(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Escribe tu nombre completo.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        ticket_type_id:   activeType?.id   ?? undefined,
        ticket_type_name: activeType?.name ?? undefined,
      };
      if (isPaid) {
        const { data } = await api.post(`/e/${slug}/checkout`, payload);
        window.location.href = data.url;
      } else {
        await api.post(`/e/${slug}/register`, payload);
        invalidateOverview();
        navigate(`/dashboard?bienvenida=${encodeURIComponent(slug)}`);
      }
    } catch (err) {
      const e409 = err.response?.status === 409;
      if (e409 && err.response?.data?.ticket_url) {
        setTicketUrl(err.response.data.ticket_url); setDone(true);
      } else {
        setFormError(err.response?.data?.error ?? 'Error al registrarse, intenta de nuevo.');
      }
    } finally { setSubmitting(false); }
  };

  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: event?.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelado */ }
  };

  if (loading || confirming) return (
    <div className="flex min-h-screen items-center justify-center gap-3 bg-yb-paper font-yb-sans">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-yb-ink border-t-transparent" />
      {confirming && <span className="text-sm text-yb-ink-muted">Confirmando pago…</span>}
    </div>
  );

  if (notFound || !event) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-yb-paper px-6 text-center font-yb-sans text-yb-ink">
      <p className="font-yb-serif text-4xl">Evento no encontrado</p>
      <p className="mt-2 text-sm text-yb-ink-muted">Este enlace puede haber expirado o no existe.</p>
      <Link to="/" className="mt-6 text-sm font-semibold underline decoration-1 underline-offset-4">Ir al inicio</Link>
    </div>
  );

  const priceLabel = hasTypes
    ? (ticketTypes.some((t) => t.price_cents === 0) ? 'Desde gratis' : `Desde ${fmtPrice(Math.min(...ticketTypes.map((t) => t.price_cents)))}`)
    : (isPaid ? fmtPrice(effectivePrice) : 'Gratis');

  return (
    <div className="min-h-screen bg-yb-paper font-yb-sans text-yb-ink">

      {/* Solo para quien administra el evento */}
      {event.can_manage && !isEmbedded() && (
        <div className="flex h-11 items-center gap-3 bg-yb-ink px-4 text-xs text-yb-paper sm:text-sm">
          <Eye size={15} className="shrink-0 text-yb-helecho" />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-semibold">Vista de invitado</span>
            {!event.is_published && <span className="ml-2 rounded-full bg-yb-laton px-2 py-0.5 text-[11px] font-semibold text-yb-ink">Borrador: solo tú lo ves</span>}
          </span>
          <Link to={`/vista-alumno/${slug}`} className="hidden items-center gap-1.5 font-semibold text-yb-helecho hover:underline sm:flex"><Smartphone size={14} /> Inicio del alumno</Link>
          <Link to="/vistas" className="flex shrink-0 items-center gap-1.5 rounded-full bg-yb-paper/10 px-3 py-1 font-semibold hover:bg-yb-paper/20"><ArrowLeft size={14} /> Salir</Link>
        </div>
      )}

      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-yb-rule bg-yb-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link to="/" className="font-yb-serif text-[26px] leading-none tracking-tight">Yuuban</Link>
          <button type="button" onClick={share}
            className="flex items-center gap-1.5 text-sm font-medium text-yb-ink-muted transition-colors hover:text-yb-ink">
            <Share2 size={15} strokeWidth={1.6} /> {copied ? 'Enlace copiado' : 'Compartir'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">

        {/* Perfil del evento */}
        <section className="animate-yb-rise flex flex-col gap-6 py-10 motion-reduce:animate-none sm:flex-row sm:items-center sm:gap-10">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-4xl text-yb-paper ring-2 ring-yb-forest ring-offset-4 ring-offset-yb-paper sm:h-32 sm:w-32 sm:text-5xl">
            {initialsOf(event.title)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yb-forest">Inscripciones abiertas</p>
            <h1 className="mt-2 font-yb-serif text-[44px] leading-[1.02] tracking-[-0.01em] sm:text-[60px]">{event.title}</h1>
            {event.summary && <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-yb-ink-muted">{event.summary}</p>}
          </div>
        </section>

        <dl className="animate-yb-rise grid grid-cols-1 border-y border-yb-rule sm:grid-cols-3 motion-reduce:animate-none" style={{ animationDelay: '120ms' }}>
          {[
            { k: 'Fecha', v: event.date || 'Por anunciar', icon: Calendar },
            { k: 'Lugar', v: event.location || 'Por anunciar', icon: MapPin },
            { k: 'Entrada', v: priceLabel, icon: Ticket },
          ].map(({ k, v, icon: Icon }, i) => (
            <div key={k} className={`flex items-baseline justify-between gap-4 py-3 sm:block sm:py-4 ${i ? 'border-t border-yb-rule sm:border-l sm:border-t-0 sm:pl-6' : 'sm:pr-4'}`}>
              <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted"><Icon size={12} strokeWidth={1.8} />{k}</dt>
              <dd className="text-right font-yb-serif text-lg sm:mt-1 sm:truncate sm:text-left sm:text-[22px]">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">

          {/* Programa */}
          <section className="animate-yb-rise order-2 motion-reduce:animate-none lg:order-1" style={{ animationDelay: '200ms' }}>
            <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">Programa</h2>
            {schedule.length > 0 ? (
              <ol className="border-t border-yb-rule">
                {schedule.map((item, i) => (
                  <li key={item.id ?? i} className="grid grid-cols-[84px_1fr] gap-4 border-b border-yb-rule py-4">
                    <span className="pt-1 text-sm font-semibold tabular-nums">
                      {item.start_time}{item.end_time && <span className="block text-xs font-normal text-yb-ink-muted">{item.end_time}</span>}
                    </span>
                    <div>
                      <div className="font-yb-serif text-[22px] leading-tight">{item.title}</div>
                      {item.place && <div className="mt-1 flex items-center gap-1.5 text-sm text-yb-ink-muted"><MapPin size={13} strokeWidth={1.6} />{item.place}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="border-t border-yb-rule py-8">
                <p className="flex items-center gap-2 font-yb-serif text-2xl"><Clock size={18} strokeWidth={1.6} /> El programa se publicará pronto.</p>
                <p className="mt-2 text-sm text-yb-ink-muted">Inscríbete y te avisaremos en cuanto esté listo.</p>
              </div>
            )}
          </section>

          {/* Inscripción */}
          <section className="animate-yb-rise order-1 motion-reduce:animate-none lg:order-2" style={{ animationDelay: '160ms' }}>
            <div className="border border-yb-rule bg-white p-6 sm:p-7 lg:sticky lg:top-20">

              {!done && paymentMsg === 'cancelled' && (
                <div className="mb-5 flex items-start gap-2.5 border-b border-yb-rule pb-4 text-sm text-red-700">
                  <XCircle size={16} className="mt-0.5 shrink-0" /> Cancelaste el pago. Puedes intentarlo de nuevo.
                </div>
              )}

              {done ? (
                <div className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yb-forest text-white"><CheckCircle2 size={26} /></span>
                  <h2 className="mt-5 font-yb-serif text-[32px] leading-tight">Ya estás dentro.</h2>
                  {selectedType && <p className="mt-1 text-sm text-yb-ink-muted">Como {selectedType.name}</p>}
                  <p className="mt-2 text-[15px] text-yb-ink-muted">Tu lugar en {event?.title ?? 'el festival'} está confirmado.</p>
                  {ticketUrl && (
                    <Link to={ticketUrl} className={`${primaryBtn} mt-6`}><Ticket size={16} /> Ver mi boleto QR</Link>
                  )}
                  <Link to="/dashboard"
                    className="mt-3 flex w-full items-center justify-center gap-1 rounded-[3px] border border-yb-rule py-3.5 text-[15px] font-semibold transition-colors hover:border-yb-ink">
                    Ir a mi inicio <ChevronRight size={15} />
                  </Link>
                  <ol className="mt-7 space-y-4 border-t border-yb-rule pt-6 text-left">
                    {[
                      ['Revisa tu correo', `Te mandamos tu boleto a ${user?.email ?? 'tu correo'}.`],
                      ['Sigue las noticias', 'Anuncios, horarios y resultados del festival llegan a tu inicio.'],
                      ['Llega y muestra tu QR', 'En la entrada escanean tu boleto y pasas en segundos.'],
                    ].map(([t, d], i) => (
                      <li key={t} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yb-ink text-xs font-semibold text-yb-paper">{i + 1}</span>
                        <div><div className="text-sm font-semibold">{t}</div><div className="text-sm text-yb-ink-muted">{d}</div></div>
                      </li>
                    ))}
                  </ol>
                </div>

              ) : hasTypes && (!selectedType || !typeConfirmed) ? (
                <div>
                  <TypeSelector types={ticketTypes} selected={selectedType} onSelect={handleSelectType} />
                  {selectedType && (
                    <button type="button" onClick={handleConfirmType} className={`${primaryBtn} mt-5`}>
                      Continuar como {selectedType.name} <ChevronRight size={15} />
                    </button>
                  )}
                </div>

              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {selectedType ? (
                    <div className="flex items-end justify-between border-b border-yb-rule pb-4">
                      <div>
                        <div className="text-xs text-yb-ink-muted">Participas como</div>
                        <div className="font-yb-serif text-2xl leading-tight">{selectedType.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-yb-serif text-xl">{effectivePrice === 0 ? 'Gratis' : fmtPrice(effectivePrice)}</div>
                        <button type="button" onClick={() => { setSelectedType(null); setTypeConfirmed(false); }}
                          className="text-xs text-yb-ink-muted underline underline-offset-2 hover:text-yb-ink">Cambiar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="pb-1">
                      <h2 className="font-yb-serif text-[32px] leading-tight">Inscríbete</h2>
                      <p className="mt-1 text-sm text-yb-ink-muted">
                        {isPaid ? `${fmtPrice(effectivePrice)} · pago seguro con tarjeta.` : 'Gratis. Te confirmamos por correo.'}
                      </p>
                    </div>
                  )}

                  <div className="text-sm">
                    <span className="text-xs font-medium text-yb-ink-muted">Tu boleto llegará a</span>
                    <div className="mt-0.5 truncate font-medium">{user?.email}</div>
                  </div>

                  {[
                    { key: 'name',       label: 'Nombre completo',     type: 'text',  placeholder: 'Ej. Ana García',       required: true,  auto: 'name' },
                  ].map(({ key, label, type, placeholder, required, auto }) => (
                    <label key={key} className="block">
                      <span className="mb-1.5 flex justify-between text-xs font-medium text-yb-ink-muted">
                        {label}{!required && <span>Opcional</span>}
                      </span>
                      <input type={type} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder} required={required} autoComplete={auto} className={inputCls} />
                    </label>
                  ))}

                  {formError && <p className="text-sm text-red-700">{formError}</p>}

                  <button type="submit" disabled={submitting} className={primaryBtn}>
                    {submitting ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />{isPaid ? 'Redirigiendo al pago…' : 'Enviando…'}</>
                    ) : isPaid ? (
                      <><CreditCard size={16} /> Pagar {fmtPrice(effectivePrice)} e inscribirme</>
                    ) : 'Quiero inscribirme'}
                  </button>

                  <p className="text-center text-xs text-yb-ink-muted">
                    {isPaid ? 'Pago procesado por Stripe. Tus datos están protegidos.' : 'Tu información no se comparte con terceros.'}
                  </p>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default EventPage;
