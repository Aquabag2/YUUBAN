import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Music2, Calendar, MapPin, CheckCircle2, Clock,
  Download, ArrowLeft, User, Ticket,
} from 'lucide-react';
import api from '../lib/api';

const STATUS = {
  confirmed: { label: 'Confirmado', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  checkedin: { label: '✓ Ingresó al evento', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
};

const TicketPage = () => {
  const { token } = useParams();
  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const printRef = useRef(null);

  // QR diario: incluye la fecha de hoy para que expire cada día
  const today = new Date().toISOString().slice(0, 10);
  const ticketUrl = `${window.location.origin}/ticket/${token}`;
  const dailyQrValue = `${token}|${today}`; // el check-in valida que la fecha sea hoy

  useEffect(() => {
    api.get(`/ticket/${token}`)
      .then(({ data }) => setTicket(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const downloadQR = () => {
    const svg = printRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 20, 20, 360, 360);
      const a = document.createElement('a');
      a.download = `ticket-yuuban-${token.substring(0, 8)}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    // encodeURIComponent → Uint8Array → base64 (evita unescape deprecado)
    const bytes = new TextEncoder().encode(svgStr);
    const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join('');
    img.src = 'data:image/svg+xml;base64,' + btoa(binary);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <Ticket size={28} className="text-white/20" />
        </div>
        <div>
          <div className="text-lg font-semibold text-white">Ticket no encontrado</div>
          <div className="mt-1 text-sm text-white/40">Este QR puede ser inválido o ya fue cancelado.</div>
        </div>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Ir al inicio
        </Link>
      </div>
    );
  }

  const ev = ticket.events ?? {};
  const isCheckedIn = ticket.checked_in;
  const status = isCheckedIn ? STATUS.checkedin : STATUS.confirmed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* ── Barra superior ── */}
      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Music2 size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">Yuuban</span>
          </div>
          <div className="flex items-center gap-2">
            {ev.slug && (
              <Link
                to={`/e/${ev.slug}`}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft size={12} /> Ver evento
              </Link>
            )}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft size={12} /> Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-10">

        {/* ── Tarjeta del ticket ── */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800/60 to-slate-900/60">

          {/* Encabezado del ticket */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600/30 to-indigo-600/20 px-8 pt-8 pb-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="relative">
              <div className="mb-1 flex items-center gap-2 text-xs text-violet-300/70">
                <Ticket size={12} /> Entrada digital · Yuuban
              </div>
              <h1 className="text-2xl font-bold text-white">{ev.title ?? 'Evento'}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/50">
                {ev.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-violet-400" /> {ev.date}
                  </span>
                )}
                {ev.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-violet-400" /> {ev.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Línea de corte */}
          <div className="relative flex items-center">
            <div className="h-px flex-1 border-t border-dashed border-white/10" />
            <div className="absolute -left-4 h-8 w-8 rounded-full bg-slate-950" />
            <div className="absolute -right-4 h-8 w-8 rounded-full bg-slate-950" />
          </div>

          {/* Cuerpo del ticket */}
          <div className="px-8 py-6 space-y-6">

            {/* Info del asistente */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                {ticket.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white">{ticket.name}</div>
                {ticket.instrument && (
                  <div className="text-xs text-white/40">{ticket.instrument}</div>
                )}
              </div>
              <span className={`ml-auto rounded-full border px-3 py-1 text-xs font-medium ${status.cls}`}>
                {status.label}
              </span>
            </div>

            {/* QR Code */}
            <div ref={printRef} className="flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-xl shadow-black/40">
                <QRCodeSVG
                  value={dailyQrValue}
                  size={200}
                  level="H"
                  marginSize={0}
                  fgColor="#0f172a"
                />
              </div>
              <p className="text-xs text-white/20 text-center">
                QR válido hoy · {today} · Se renueva cada día
              </p>
              {isCheckedIn ? (
                <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 px-4 py-2.5 text-sm text-violet-300">
                  <CheckCircle2 size={16} />
                  Ingresó el {ticket.checked_in_at
                    ? new Date(ticket.checked_in_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                    : 'evento'}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <Clock size={12} />
                  Muestra este QR en la entrada del evento
                </div>
              )}
            </div>

            {/* Token visible (backup manual) */}
            <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-center">
              <div className="text-xs text-white/30 mb-1">Código de respaldo</div>
              <div className="font-mono text-sm font-semibold tracking-widest text-white/60">
                {token.substring(0, 8).toUpperCase()}
              </div>
            </div>

            {/* Botón descargar QR */}
            <button
              type="button"
              onClick={downloadQR}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all"
            >
              <Download size={15} /> Guardar QR
            </button>

            {/* Botón constancia */}
            {ticket.certificate_url && (
              <a
                href={`/api/certificates/download/${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
              >
                <Download size={15} /> Descargar constancia
              </a>
            )}

            <p className="text-center text-xs text-white/20">
              Guarda este link o captura de pantalla. No necesitas imprimirlo.
            </p>
          </div>
        </div>

        {/* Asistente info extra */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/3 px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-white/40">
            <User size={14} />
            <span>Registrado como <span className="text-white/70">{ticket.email}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPage;
