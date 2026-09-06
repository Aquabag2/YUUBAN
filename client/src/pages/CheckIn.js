import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanLine, Search, CheckCircle2, XCircle, Music2,
  Users, Clock, ArrowLeft, Camera, CameraOff,
  RefreshCw, Filter,
} from 'lucide-react';
import api from '../lib/api';

const FILTERS = [
  { key: 'all',     label: 'Todos' },
  { key: 'in',      label: 'Entraron' },
  { key: 'pending', label: 'Pendientes' },
];

const CheckIn = () => {
  const { slug } = useParams();
  const [attendees, setAttendees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [tokenInput, setTokenInput] = useState('');
  const [scanning, setScanning]     = useState(false);
  const [cameraOn, setCameraOn]     = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const tokenRef   = useRef(null);
  const scannerRef = useRef(null);
  const qrDivId    = 'qr-reader';

  // ── Cargar asistentes ──────────────────────────────────────────────────────
  const reload = useCallback(() =>
    api.get(`/e/${slug}/attendees`)
      .then(({ data }) => setAttendees(data ?? []))
      .catch(() => {}),
  [slug]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  // ── Marcar entrada ─────────────────────────────────────────────────────────
  const checkin = useCallback(async (rawToken) => {
    // Extraer el token si viene como URL completa (del QR)
    const token = rawToken.trim().includes('/ticket/')
      ? rawToken.trim().split('/ticket/').pop()
      : rawToken.trim();

    if (!token) return;
    setScanning(true);
    setLastResult(null);

    try {
      const { data } = await api.post(`/ticket/${token}/checkin`);
      if (data.already) {
        setLastResult({ ok: true, name: data.name, already: true });
      } else {
        setLastResult({ ok: true, name: data.name, already: false });
        setAttendees((prev) =>
          prev.map((a) => a.ticket_token === token.split('|')[0]
            ? { ...a, checked_in: true, checked_in_at: new Date().toISOString() } : a)
        );
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Ticket no válido para este evento.';
      const isPago = err.response?.status === 402;
      setLastResult({ ok: false, msg, isPago, name: err.response?.data?.name });
    } finally {
      setScanning(false);
      setTokenInput('');
      tokenRef.current?.focus();
      setTimeout(() => setLastResult(null), 5000);
    }
  }, [attendees]);

  // ── Cámara QR ─────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError('');
    try {
      const qr = new Html5Qrcode(qrDivId);
      scannerRef.current = qr;
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => checkin(text),
        () => {}
      );
      setCameraOn(true);
    } catch {
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setCameraOn(false);
  };

  useEffect(() => () => { stopCamera(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtros ────────────────────────────────────────────────────────────────
  const filtered = attendees.filter((a) => {
    const matchSearch =
      search.trim() === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.instrument ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'in'      &&  a.checked_in) ||
      (filter === 'pending' && !a.checked_in);
    return matchSearch && matchFilter;
  });

  const total      = attendees.length;
  const totalIn    = attendees.filter((a) => a.checked_in).length;
  const totalPend  = total - totalIn;
  const pct        = total > 0 ? Math.round((totalIn / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 pb-16">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Music2 size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Check-in</div>
              <div className="max-w-[140px] truncate text-xs text-white/30">{slug}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reload}
              className="rounded-lg border border-white/10 p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
              title="Actualizar lista"
            >
              <RefreshCw size={13} />
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft size={12} /> Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-6 py-6">

        {/* ── Stats + barra de progreso ── */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/3">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {[
              { label: 'Total',      value: total,     color: 'text-white' },
              { label: 'Entraron',   value: totalIn,   color: 'text-emerald-400' },
              { label: 'Pendientes', value: totalPend, color: 'text-rose-400' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-4 text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="mt-0.5 text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Barra de progreso */}
          <div className="h-1.5 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="px-4 py-2 text-right text-xs text-white/20">{pct}% asistencia</div>
        </div>

        {/* ── Escáner de cámara ── */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ScanLine size={15} className="text-violet-400" /> Escáner QR
            </div>
            <button
              type="button"
              onClick={cameraOn ? stopCamera : startCamera}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                cameraOn
                  ? 'border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                  : 'border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
              }`}
            >
              {cameraOn ? <><CameraOff size={13} /> Apagar</> : <><Camera size={13} /> Activar cámara</>}
            </button>
          </div>

          {/* Ventana de la cámara */}
          <div
            id={qrDivId}
            className={`overflow-hidden rounded-xl transition-all duration-300 ${cameraOn ? 'min-h-[280px]' : 'hidden'}`}
            style={{ background: '#000' }}
          />

          {cameraError && (
            <div className="mt-2 rounded-xl bg-rose-500/10 px-4 py-2.5 text-xs text-rose-400">
              {cameraError}
            </div>
          )}

          {!cameraOn && (
            <p className="text-xs text-white/30">
              Activa la cámara para escanear QRs directamente. El ticket se marca solo al detectarlo.
            </p>
          )}
        </div>

        {/* ── Entrada manual de código ── */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <div className="mb-3 text-sm font-semibold text-white">Código manual</div>
          <div className="flex gap-2">
            <input
              ref={tokenRef}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkin(tokenInput)}
              placeholder="Pega el código o URL del ticket…"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 transition-all"
            />
            <button
              type="button"
              onClick={() => checkin(tokenInput)}
              disabled={scanning || !tokenInput.trim()}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition-all"
            >
              {scanning ? '…' : 'OK'}
            </button>
          </div>

          {/* Resultado */}
          {lastResult && (
            <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${
              lastResult.ok
                ? 'bg-emerald-500/15 text-emerald-300'
                : lastResult.isPago
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-rose-500/15 text-rose-400'
            }`}>
              <div className="flex items-center gap-3">
                {lastResult.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                {lastResult.ok
                  ? lastResult.already
                    ? `${lastResult.name} — ya había ingresado antes`
                    : `¡Bienvenido, ${lastResult.name}! ✓`
                  : lastResult.msg}
              </div>
              {lastResult.isPago && (
                <div className="mt-1 pl-7 text-xs text-amber-400/70">
                  Debe completar el pago antes de ingresar al festival.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Lista de asistentes ── */}
        <div className="rounded-2xl border border-white/10 bg-white/3">

          {/* Barra de búsqueda y filtros */}
          <div className="space-y-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <Search size={14} className="shrink-0 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, correo o instrumento…"
                className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-xs text-white/30 hover:text-white">
                  ✕
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-white/20" />
              {FILTERS.map((f) => {
                const count = f.key === 'all' ? total : f.key === 'in' ? totalIn : totalPend;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      filter === f.key
                        ? f.key === 'in'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : f.key === 'pending'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-violet-500/20 text-violet-300'
                        : 'text-white/30 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {f.label}
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filas */}
          {loading ? (
            <div className="space-y-2 p-4">
              {[1,2,3,4,5].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Users size={22} className="text-white/15" />
              <div className="text-sm text-white/30">
                {search || filter !== 'all' ? 'Sin resultados con ese filtro' : 'Sin asistentes registrados'}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-all ${
                    a.checked_in
                      ? 'bg-emerald-500/5 hover:bg-emerald-500/8'
                      : 'hover:bg-white/3'
                  }`}
                >
                  {/* Indicador verde / rojo */}
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-lg ${
                    a.checked_in
                      ? 'bg-emerald-400 shadow-emerald-500/50'
                      : 'bg-rose-500/60 shadow-rose-500/30'
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-sm font-medium ${a.checked_in ? 'text-emerald-100' : 'text-white'}`}>
                        {a.name}
                      </span>
                      {a.instrument && (
                        <span className="hidden shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40 sm:block">
                          {a.instrument}
                        </span>
                      )}
                      {!a.paid && (
                        <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                          Sin pago
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-white/30">{a.email}</div>
                  </div>

                  {/* Estado / acción */}
                  {a.checked_in ? (
                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 size={13} /> Ingresó
                      </div>
                      {a.checked_in_at && (
                        <div className="text-xs text-white/20">
                          {new Date(a.checked_in_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => checkin(a.ticket_token)}
                      disabled={scanning}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/50 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 disabled:opacity-40 transition-all"
                    >
                      Marcar entrada
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 border-t border-white/5 py-3 text-xs text-white/20">
              <Clock size={11} />
              {filtered.length} de {total} asistentes
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CheckIn;
