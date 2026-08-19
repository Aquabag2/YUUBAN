import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, Music2, CheckCircle2, Share2, Ticket, CreditCard, XCircle } from 'lucide-react';
import api from '../lib/api';

const COVER_GRADIENTS = {
  violet: 'from-violet-600/40 via-indigo-600/20 to-slate-900/80',
  emerald: 'from-emerald-600/40 via-teal-600/20 to-slate-900/80',
  amber:   'from-amber-600/40 via-orange-600/20 to-slate-900/80',
  rose:    'from-rose-600/40 via-pink-600/20 to-slate-900/80',
  indigo:  'from-indigo-600/40 via-blue-600/20 to-slate-900/80',
};
const BLOB_COLORS = {
  violet: 'bg-violet-500/15', emerald: 'bg-emerald-500/15',
  amber:  'bg-amber-500/15',  rose:    'bg-rose-500/15', indigo: 'bg-indigo-500/15',
};
const ACCENT_COLORS = {
  violet: 'text-violet-400', emerald: 'text-emerald-400',
  amber:  'text-amber-400',  rose:    'text-rose-400', indigo: 'text-indigo-400',
};
const BUTTON_COLORS = {
  violet: 'from-violet-600 to-indigo-600 shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500',
  emerald: 'from-emerald-600 to-teal-600 shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500',
  amber:   'from-amber-600 to-orange-600 shadow-amber-500/25 hover:from-amber-500 hover:to-orange-500',
  rose:    'from-rose-600 to-pink-600 shadow-rose-500/25 hover:from-rose-500 hover:to-pink-500',
  indigo:  'from-indigo-600 to-blue-600 shadow-indigo-500/25 hover:from-indigo-500 hover:to-blue-500',
};

const EMPTY_FORM = { name: '', email: '', instrument: '', notes: '' };

const fmtPrice = (cents) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(cents / 100);

const EventPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const [event, setEvent]       = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [ticketUrl, setTicketUrl]   = useState('');
  const [done, setDone]             = useState(false);
  const [formError, setFormError]   = useState('');

  // Stripe return states
  const paymentParam  = searchParams.get('payment');
  const sessionId     = searchParams.get('session_id');
  const [paymentMsg, setPaymentMsg]   = useState('');
  const [confirming, setConfirming]   = useState(false);

  useEffect(() => {
    api.get(`/e/${slug}`)
      .then(({ data }) => {
        setEvent(data);
        return api.get(`/e/${slug}/schedule`).catch(() => ({ data: [] }));
      })
      .then(({ data }) => setSchedule(data ?? []))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Handle Stripe redirect back to this page
  useEffect(() => {
    if (paymentParam === 'cancelled') {
      setPaymentMsg('cancelled');
      return;
    }
    if (paymentParam === 'success' && sessionId) {
      setConfirming(true);
      api.post(`/e/${slug}/confirm-payment`, { session_id: sessionId })
        .then(({ data }) => {
          setTicketUrl(data.ticket_url);
          setDone(true);
        })
        .catch((err) => {
          setFormError(err.response?.data?.error ?? 'Error al confirmar el pago.');
        })
        .finally(() => setConfirming(false));
    }
  }, [paymentParam, sessionId, slug]);

  const isPaid = (event?.price_cents ?? 0) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Nombre y correo son obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      if (isPaid) {
        // Redirect to Stripe Checkout
        const { data } = await api.post(`/e/${slug}/checkout`, form);
        window.location.href = data.url;
      } else {
        const { data } = await api.post(`/e/${slug}/register`, form);
        setTicketUrl(data.ticket_url ?? '');
        setDone(true);
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      const e409 = err.response?.status === 409;
      if (e409 && err.response?.data?.ticket_url) {
        setTicketUrl(err.response.data.ticket_url);
        setDone(true);
      } else {
        setFormError(err.response?.data?.error ?? 'Error al registrarse, intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const color    = event?.cover_color ?? 'violet';
  const gradient = COVER_GRADIENTS[color] ?? COVER_GRADIENTS.violet;
  const blob     = BLOB_COLORS[color]     ?? BLOB_COLORS.violet;
  const accent   = ACCENT_COLORS[color]   ?? ACCENT_COLORS.violet;
  const btn      = BUTTON_COLORS[color]   ?? BUTTON_COLORS.violet;

  if (loading || confirming) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        {confirming && <span className="ml-3 text-sm text-white/40">Confirmando pago…</span>}
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <Music2 size={28} className="text-white/20" />
        </div>
        <div>
          <div className="text-lg font-semibold text-white">Evento no encontrado</div>
          <div className="mt-1 text-sm text-white/40">Este enlace puede haber expirado o no existe.</div>
        </div>
        <Link to="/" className="mt-2 flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Music2 size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">Yuuban</span>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(window.location.href).catch(() => {})}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Share2 size={12} /> Compartir
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">

        {/* ── Hero ── */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} border border-white/10 p-10`}>
          <div className={`pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full ${blob} blur-3xl`} />
          <div className={`pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full ${blob} blur-3xl`} />
          <div className="relative">
            <div className={`mb-2 text-sm font-medium ${accent}`}>Evento musical</div>
            <h1 className="text-4xl font-bold tracking-tight text-white">{event.title}</h1>
            {event.summary && (
              <p className="mt-3 max-w-xl text-base text-white/60 leading-relaxed">{event.summary}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-5 text-sm text-white/50">
              {event.date && (
                <span className="flex items-center gap-2">
                  <Calendar size={15} className={accent} /> {event.date}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={15} className={accent} /> {event.location}
                </span>
              )}
              {isPaid && (
                <span className={`flex items-center gap-2 font-semibold ${accent}`}>
                  <CreditCard size={15} /> {fmtPrice(event.price_cents)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">

          {/* ── Programa ── */}
          <section>
            <h2 className="mb-5 text-xl font-bold text-white">Programa</h2>
            {schedule.length > 0 ? (
              <div className="space-y-3">
                {schedule.map((item, i) => (
                  <div key={item.id ?? i} className="flex gap-4 rounded-2xl border border-white/10 bg-white/3 px-5 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <span className={`font-mono text-sm font-bold ${accent}`}>{item.start_time}</span>
                      {item.end_time && (
                        <>
                          <div className="flex-1 w-px bg-white/10" />
                          <span className="font-mono text-xs text-white/30">{item.end_time}</span>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{item.title}</div>
                      {item.place && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                          <MapPin size={11} /> {item.place}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-14 text-center">
                <Clock size={22} className="text-white/20" />
                <div className="text-sm text-white/30">El programa se publicará pronto.</div>
              </div>
            )}
          </section>

          {/* ── Formulario / estado ── */}
          <section>
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-white/3 p-6">

              {/* Pago cancelado */}
              {!done && paymentMsg === 'cancelled' && (
                <div className="mb-4 flex items-start gap-3 rounded-xl bg-rose-500/10 px-4 py-3">
                  <XCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                  <div className="text-sm text-rose-300">
                    Cancelaste el pago. Puedes intentarlo de nuevo cuando quieras.
                  </div>
                </div>
              )}

              <h2 className="text-xl font-bold text-white">
                {isPaid ? `Inscríbete · ${fmtPrice(event.price_cents)}` : 'Inscríbete'}
              </h2>
              <p className="mt-1 text-sm text-white/50">
                {isPaid ? 'Pago seguro con tarjeta vía Stripe.' : 'Gratis. Te confirmaremos por correo.'}
              </p>

              {done ? (
                <div className="mt-6 flex flex-col items-center gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle2 size={26} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">¡Listo! Estás inscrito.</div>
                    <div className="mt-1 text-sm text-white/50">
                      Tu entrada digital está lista. Guárdala para mostrarla en la puerta.
                    </div>
                  </div>
                  {ticketUrl && (
                    <Link
                      to={ticketUrl}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all"
                    >
                      <Ticket size={15} /> Ver mi ticket QR
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDone(false); setTicketUrl(''); setPaymentMsg(''); }}
                    className="text-xs text-white/30 underline hover:text-white/60 transition-colors"
                  >
                    Inscribir a otra persona
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Nombre completo *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ej. Ana García"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Correo electrónico *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="tu@correo.com"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Instrumento / área (opcional)</label>
                    <input
                      value={form.instrument}
                      onChange={(e) => setForm((p) => ({ ...p, instrument: e.target.value }))}
                      placeholder="Ej. Piano, Guitarra, Canto…"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Comentarios (opcional)</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="¿Algo que debamos saber?"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    />
                  </div>

                  {formError && (
                    <div className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-xs text-rose-400">
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60 ${btn}`}
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {isPaid ? 'Redirigiendo a pago…' : 'Enviando…'}
                      </>
                    ) : isPaid ? (
                      <><CreditCard size={15} /> Pagar {fmtPrice(event.price_cents)} e inscribirme</>
                    ) : 'Quiero inscribirme'}
                  </button>

                  <p className="text-center text-xs text-white/20">
                    {isPaid
                      ? 'Pago procesado por Stripe. Tu información está segura.'
                      : 'Tu información no se compartirá con terceros.'}
                  </p>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EventPage;
