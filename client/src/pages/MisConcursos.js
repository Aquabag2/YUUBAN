import { useEffect, useState } from 'react';
import { Trophy, CheckCircle2, Circle, Clock, MapPin, Calendar, Download, ChevronRight } from 'lucide-react';
import api from '../lib/api';

// ── Fases de un concurso ────────────────────────────────────────────────────────
const PHASES = ['Inscripción', 'Audición', 'Evaluación', 'Resultados'];

// Devuelve el índice de la fase activa según el status de la inscripción
const phaseIndex = (status) => {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (s.includes('result'))    return 3;
  if (s.includes('eval'))      return 2;
  if (s.includes('audic') || s.includes('presentac')) return 1;
  return 0;
};

// ── Colores por lugar ────────────────────────────────────────────────────────────
const PLACE_STYLES = {
  1: { medal: '🥇', label: '1.er Lugar', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  2: { medal: '🥈', label: '2.° Lugar',  color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-200' },
  3: { medal: '🥉', label: '3.er Lugar', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
};

// ── Timeline de fases ────────────────────────────────────────────────────────────
function PhaseBar({ status }) {
  const active = phaseIndex(status);
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1 scrollbar-none">
      {PHASES.map((phase, i) => (
        <div key={phase} className="flex items-center gap-0 shrink-0">
          <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all
              ${i < active  ? 'border-violet-500 bg-violet-500 text-white'
              : i === active ? 'border-violet-500 bg-violet-50 text-violet-600 ring-4 ring-violet-100'
              :                'border-gray-200 bg-white text-gray-300'}`}>
              {i < active ? <CheckCircle2 size={14} /> : i === active ? <Clock size={12} /> : <Circle size={12} />}
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight
              ${i < active ? 'text-violet-500' : i === active ? 'text-gray-800' : 'text-gray-300'}`}>
              {phase}
            </span>
          </div>
          {i < PHASES.length - 1 && (
            <div className={`h-0.5 w-8 mb-4 shrink-0 ${i < active ? 'bg-violet-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tarjeta de concurso inscrito ─────────────────────────────────────────────────
function ContestCard({ enrollment }) {
  const c = enrollment.contest ?? enrollment.contests ?? {};
  const status = enrollment.status ?? 'inscrito';
  const isFinished = phaseIndex(status) === 3;
  const place = enrollment.place ?? enrollment.resultado_lugar ?? null;
  const placeStyle = place ? (PLACE_STYLES[place] ?? null) : null;
  const score = enrollment.score ?? enrollment.puntaje ?? null;
  const piece = enrollment.piece ?? enrollment.pieza ?? null;
  const auditionDate = enrollment.audition_date ?? enrollment.fecha_audicion ?? null;
  const resultsDate  = c.results_date ?? c.fecha_resultados ?? null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-2xl">
          {isFinished ? (placeStyle?.medal ?? '🏅') : '🏆'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-600">
            {c.category ?? c.categoria ?? 'Concurso'}
          </div>
          <div className="font-bold text-gray-900 text-base leading-snug">{c.name ?? c.nombre ?? '—'}</div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-400">
            {(c.location ?? c.ubicacion) && (
              <span className="flex items-center gap-1"><MapPin size={10} />{c.location ?? c.ubicacion}</span>
            )}
            {(c.date ?? c.fecha) && (
              <span className="flex items-center gap-1"><Calendar size={10} />{c.date ?? c.fecha}</span>
            )}
          </div>
        </div>
        {/* Chip de estado */}
        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold
          ${isFinished
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : phaseIndex(status) === 2
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-violet-50 text-violet-700 border border-violet-200'
          }`}>
          {isFinished ? 'Finalizado' : phaseIndex(status) === 2 ? 'En evaluación' : 'Inscrito'}
        </span>
      </div>

      {/* Separador + cuerpo */}
      <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
        <PhaseBar status={status} />

        {/* Detalles */}
        {(piece || auditionDate || resultsDate || (c.judge ?? c.jurado)) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {piece && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Pieza</div>
                <div className="text-xs font-semibold text-gray-700 leading-tight">{piece}</div>
              </div>
            )}
            {auditionDate && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Audición</div>
                <div className="text-xs font-semibold text-gray-700">{auditionDate}</div>
              </div>
            )}
            {resultsDate && !isFinished && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Resultados</div>
                <div className="text-xs font-semibold text-gray-700">{resultsDate}</div>
              </div>
            )}
            {(c.judge ?? c.jurado) && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Jurado</div>
                <div className="text-xs font-semibold text-gray-700">{c.judge ?? c.jurado}</div>
              </div>
            )}
          </div>
        )}

        {/* Banner de resultado */}
        {isFinished && placeStyle && (
          <div className={`flex items-center gap-3 rounded-xl border p-4 ${placeStyle.bg}`}>
            <span className="text-3xl leading-none">{placeStyle.medal}</span>
            <div className="flex-1">
              <div className={`font-bold text-base ${placeStyle.color}`}>{placeStyle.label}</div>
              {score != null && (
                <div className="text-xs text-gray-500 mt-0.5">Puntaje: {score}/100</div>
              )}
              {piece && (
                <div className="text-xs text-gray-500">Pieza: {piece}</div>
              )}
            </div>
            <button
              onClick={() => alert('Descarga de diploma próximamente')}
              className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors shrink-0"
            >
              <Download size={12} />
              Diploma
            </button>
          </div>
        )}

        {/* Banner en evaluación — sin resultado aún */}
        {phaseIndex(status) === 2 && !isFinished && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-700">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            El jurado está evaluando las audiciones. Resultados el{' '}
            <strong>{resultsDate ?? '—'}</strong>.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tarjeta de concurso disponible ───────────────────────────────────────────────
function AvailableCard({ contest }) {
  const c = contest.contest ?? contest;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className={`h-20 ${contest._gradient ?? 'bg-gradient-to-br from-violet-500 to-indigo-600'}`} />
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-600">
            {c.category ?? c.categoria ?? 'Concurso'}
          </div>
          <div className="font-bold text-gray-900 leading-snug">{c.name ?? c.nombre ?? '—'}</div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          {(c.location ?? c.ubicacion) && (
            <span className="flex items-center gap-1"><MapPin size={10} />{c.location ?? c.ubicacion}</span>
          )}
          {(c.deadline ?? c.fecha_cierre) && (
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <Calendar size={10} />Cierre: {c.deadline ?? c.fecha_cierre}
            </span>
          )}
        </div>
        <button
          onClick={() => alert('Inscripción próximamente desde el panel de administración')}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors"
        >
          Ver requisitos <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────────
const AVAILABLE_FALLBACK = [
  {
    _gradient: 'bg-gradient-to-br from-fuchsia-500 to-purple-700',
    name: 'Premio Iberoamericano de Piano',
    category: 'Concurso Internacional',
    location: 'Madrid',
    deadline: '15 ene 2027',
  },
  {
    _gradient: 'bg-gradient-to-br from-sky-500 to-blue-700',
    name: 'Encuentro Musical Regio 2026',
    category: 'Concurso Local',
    location: 'Monterrey',
    deadline: '20 oct 2026',
  },
];

const MisConcursos = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [available,   setAvailable]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/my-contests').catch(() => ({ data: [] })),
      api.get('/contests').catch(() => ({ data: [] })),
    ]).then(([myRes, allRes]) => {
      setEnrollments(myRes.data ?? []);
      // Filtrar los ya inscritos
      const enrolledIds = new Set((myRes.data ?? []).map(e => e.contest_id ?? e.contests?.id));
      const allContests = allRes.data ?? [];
      const pending = allContests.filter(c => !enrolledIds.has(c.id));
      setAvailable(pending.length ? pending : AVAILABLE_FALLBACK);
    }).finally(() => setLoading(false));
  }, []);

  const active   = enrollments.filter(e => phaseIndex(e.status ?? '') < 3);
  const finished = enrollments.filter(e => phaseIndex(e.status ?? '') === 3);

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-400/10 to-white border border-amber-200/60 p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2 text-sm text-amber-600 font-medium">
            <Trophy size={15} />
            <span>Mis Concursos</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Competencias y resultados</h1>
          <p className="mt-1 text-sm text-gray-500">
            {active.length} activo{active.length !== 1 ? 's' : ''} · {finished.length} completado{finished.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Activos ── */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : active.length > 0 ? (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-xs">
              {active.length}
            </span>
            En curso
          </h2>
          <div className="flex flex-col gap-4">
            {active.map((e, i) => <ContestCard key={e.id ?? i} enrollment={e} />)}
          </div>
        </section>
      ) : !loading && finished.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Trophy size={24} className="text-gray-300" />
          </div>
          <div>
            <div className="font-semibold text-gray-400">Sin inscripciones activas</div>
            <div className="mt-0.5 text-xs text-gray-300">Revisa los concursos disponibles aquí abajo</div>
          </div>
        </div>
      ) : null}

      {/* ── Completados ── */}
      {finished.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 text-xs">
              {finished.length}
            </span>
            Historial
          </h2>
          <div className="flex flex-col gap-4">
            {finished.map((e, i) => <ContestCard key={e.id ?? i} enrollment={e} />)}
          </div>
        </section>
      )}

      {/* ── Disponibles ── */}
      <section>
        <h2 className="mb-4 text-base font-bold text-gray-900">Disponibles para inscribirte</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((c, i) => <AvailableCard key={c.id ?? i} contest={c} />)}
        </div>
      </section>

    </div>
  );
};

export default MisConcursos;
