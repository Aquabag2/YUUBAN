import { useEffect, useState } from 'react';
import { MapPin, Calendar } from 'lucide-react';
import api from '../lib/api';
import { Rise, PageTitle, SectionTitle, EmptyState } from '../components/yb';

/* Concursos del alumno: fase actual, resultados y concursos abiertos */

const PHASES = ['Inscripción', 'Audición', 'Evaluación', 'Resultados'];

const phaseIndex = (status) => {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (s.includes('result')) return 3;
  if (s.includes('eval')) return 2;
  if (s.includes('audic') || s.includes('presentac')) return 1;
  return 0;
};

const PLACE_LABELS = { 1: '1.er lugar', 2: '2.º lugar', 3: '3.er lugar' };

const PhaseBar = ({ status }) => {
  const active = phaseIndex(status);
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {PHASES.map((p, i) => (
        <div key={p}>
          <div className={`h-[3px] ${i <= active ? 'bg-yb-forest' : 'bg-yb-rule'}`} />
          <div className={`mt-1.5 text-[11px] ${i === active ? 'font-semibold text-yb-ink' : 'text-yb-ink-muted'}`}>{p}</div>
        </div>
      ))}
    </div>
  );
};

const Detail = ({ label, value }) => value ? (
  <div>
    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{label}</div>
    <div className="mt-0.5 text-sm">{value}</div>
  </div>
) : null;

const ContestCard = ({ enrollment }) => {
  const c = enrollment.contest ?? enrollment.contests ?? {};
  const status = enrollment.status ?? 'inscrito';
  const phase = phaseIndex(status);
  const finished = phase === 3;
  const place = enrollment.place ?? enrollment.resultado_lugar ?? null;
  const score = enrollment.score ?? enrollment.puntaje ?? null;
  const piece = enrollment.piece ?? enrollment.pieza ?? null;
  const resultsDate = c.results_date ?? c.fecha_resultados ?? null;

  return (
    <article className="border border-yb-rule bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{c.category ?? c.categoria ?? 'Concurso'}</div>
          <h3 className="mt-1 font-yb-serif text-[24px] leading-tight">{c.name ?? c.nombre ?? '—'}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-yb-ink-muted">
            {(c.location ?? c.ubicacion) && <span className="flex items-center gap-1.5"><MapPin size={13} strokeWidth={1.6} />{c.location ?? c.ubicacion}</span>}
            {(c.date ?? c.fecha) && <span className="flex items-center gap-1.5"><Calendar size={13} strokeWidth={1.6} />{c.date ?? c.fecha}</span>}
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-yb-forest">
          {finished ? 'Finalizado' : phase === 2 ? 'En evaluación' : 'Inscrito'}
        </span>
      </div>

      {finished && (place || score != null) && (
        <div className="mt-5 flex items-end justify-between border-y border-yb-rule py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">Resultado</div>
            <div className="mt-1 font-yb-serif text-[34px] leading-none text-yb-forest">{PLACE_LABELS[place] ?? (place ? `${place}.º lugar` : 'Participación')}</div>
          </div>
          {score != null && <div className="text-right text-sm text-yb-ink-muted">Puntaje<div className="font-yb-serif text-2xl text-yb-ink">{score}<span className="text-base text-yb-ink-muted">/100</span></div></div>}
        </div>
      )}

      <div className="mt-5"><PhaseBar status={status} /></div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Detail label="Pieza" value={piece} />
        <Detail label="Audición" value={enrollment.audition_date ?? enrollment.fecha_audicion} />
        {!finished && <Detail label="Resultados" value={resultsDate} />}
        <Detail label="Jurado" value={c.judge ?? c.jurado} />
      </div>

      {phase === 2 && !finished && (
        <p className="mt-5 border-t border-yb-rule pt-4 text-sm text-yb-ink-muted">
          El jurado está evaluando. Resultados{resultsDate ? ` el ${resultsDate}` : ' pronto'}.
        </p>
      )}
    </article>
  );
};

const AvailableRow = ({ contest: c }) => (
  <li className="flex items-start justify-between gap-4 border-b border-yb-rule py-4">
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{c.category ?? 'Concurso'}</div>
      <div className="mt-0.5 font-yb-serif text-xl leading-tight">{c.name}</div>
      {c.location && <div className="mt-1 text-sm text-yb-ink-muted">{c.location}</div>}
    </div>
    {c.deadline && <div className="shrink-0 text-right text-xs text-yb-ink-muted">Cierra<div className="text-sm font-semibold text-yb-ink">{c.deadline}</div></div>}
  </li>
);

const MisConcursos = () => {
  const [enrollments, setEnrollments] = useState(null);
  const [available, setAvailable]     = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/my-contests').catch(() => ({ data: [] })),
      api.get('/contests').catch(() => ({ data: [] })),
    ]).then(([myRes, allRes]) => {
      const mine = myRes.data ?? [];
      const enrolled = new Set(mine.map((e) => e.contest_id ?? e.contests?.id));
      setEnrollments(mine);
      setAvailable((allRes.data ?? []).filter((c) => !enrolled.has(c.id)));
    });
  }, []);

  const active   = (enrollments ?? []).filter((e) => phaseIndex(e.status) < 3);
  const finished = (enrollments ?? []).filter((e) => phaseIndex(e.status) === 3);

  return (
    <div className="font-yb-sans text-yb-ink">
      <PageTitle kicker="Concursos" title="Resultados"
        subtitle={enrollments ? `${active.length} en curso · ${finished.length} con resultado` : 'Tus concursos y resultados.'} />

      {enrollments === null ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-48 animate-pulse bg-yb-rule/60" />)}</div>
      ) : enrollments.length === 0 ? (
        <Rise i={2}><EmptyState title="Aún no participas en concursos." text="Cuando te inscribas a un concurso, aquí verás su avance y tu resultado." /></Rise>
      ) : (
        <>
          {finished.length > 0 && (
            <Rise i={2} className="mb-10">
              <SectionTitle>Con resultado</SectionTitle>
              <div className="space-y-4 border-t border-yb-rule pt-4">{finished.map((e, i) => <ContestCard key={e.id ?? i} enrollment={e} />)}</div>
            </Rise>
          )}
          {active.length > 0 && (
            <Rise i={3} className="mb-10">
              <SectionTitle>En curso</SectionTitle>
              <div className="space-y-4 border-t border-yb-rule pt-4">{active.map((e, i) => <ContestCard key={e.id ?? i} enrollment={e} />)}</div>
            </Rise>
          )}
        </>
      )}

      {available.length > 0 && (
        <Rise i={4} className="mt-6">
          <SectionTitle>Concursos abiertos</SectionTitle>
          <ul className="border-t border-yb-rule">{available.map((c) => <AvailableRow key={c.id} contest={c} />)}</ul>
        </Rise>
      )}
    </div>
  );
};

export default MisConcursos;
