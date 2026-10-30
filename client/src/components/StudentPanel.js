import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, MapPin, Pin, ChevronRight, CalendarDays, Trophy, Compass, Clock, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { usePreviewSlug, overviewUrl } from '../lib/preview';
import { EventAvatar, initialsOf } from './yb';

/*
 * Panel "Tu día" del alumno: lo próximo, su horario, boletos y anuncios fijados.
 * En escritorio va a la derecha del feed; en celular se abre como hoja desde abajo.
 */

// Una sola petición por URL compartida entre la columna y la hoja (dura 1 min)
let cache = {};
const loadOverview = (url) => {
  const hit = cache[url];
  if (!hit || Date.now() - hit.at > 60_000) {
    cache[url] = { at: Date.now(), promise: api.get(url).then((r) => r.data).catch(() => null) };
  }
  return cache[url].promise;
};

// Llamar después de inscribirse para que el panel muestre el boleto nuevo
export const invalidateOverview = () => { cache = {}; };

export const useOverview = () => {
  const url = overviewUrl(usePreviewSlug());
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    setData(null);
    loadOverview(url).then((d) => alive && setData(d ?? { tickets: [], schedule: [], pinned: [] }));
    return () => { alive = false; };
  }, [url]);
  return data;
};

// "10:30:00" → minutos desde medianoche
const toMin = (t) => {
  const [h, m] = String(t ?? '').split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};
const hhmm = (t) => String(t ?? '').slice(0, 5);

// Minuto actual; se actualiza cada 30 s para que "en 5 min" no se quede viejo
const useNowMin = () => {
  const get = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const [now, setNow] = useState(get);
  useEffect(() => { const t = setInterval(() => setNow(get()), 30_000); return () => clearInterval(t); }, []);
  return now;
};

const inLabel = (mins) => (mins < 60 ? `en ${mins} min` : `en ${Math.floor(mins / 60)} h ${mins % 60 ? `${mins % 60} min` : ''}`.trim());

const Block = ({ title, aside, children }) => (
  <section className="mt-7 first:mt-0">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);

const Skeleton = () => (
  <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse bg-yb-rule/60" />)}</div>
);

const StudentPanel = ({ onNavigate }) => {
  const { user } = useAuth();
  const data = useOverview();
  const now = useNowMin();
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  const schedule = (data?.schedule ?? []).map((s) => ({ ...s, start: toMin(s.start_time), end: toMin(s.end_time) }));
  const live = schedule.find((s) => s.start !== null && s.start <= now && (s.end ?? s.start + 60) > now);
  const next = schedule.find((s) => s.start !== null && s.start > now);
  const spotlight = live ?? next;

  return (
    <div className="font-yb-sans text-yb-ink">
      {/* Quién soy */}
      <Link to="/perfil" onClick={onNavigate} className="group flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-lg text-yb-paper">
          {initialsOf(user?.email)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold group-hover:underline">{name}</div>
          <div className="truncate text-xs text-yb-ink-muted">{user?.email}</div>
        </div>
        <span className="text-xs font-semibold text-yb-forest">Perfil</span>
      </Link>

      {/* Lo próximo */}
      <div className="mt-6">
        {data === null ? <div className="h-28 animate-pulse bg-yb-rule/60" /> : spotlight ? (
          <div className="relative overflow-hidden bg-yb-forest p-5 text-yb-paper">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-yb-helecho">
              {live ? (
                <><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yb-helecho opacity-75 motion-reduce:hidden" /><span className="relative inline-flex h-2 w-2 rounded-full bg-yb-helecho" /></span> Ahora</>
              ) : <><Clock size={12} /> {inLabel(spotlight.start - now)}</>}
            </div>
            <div className="mt-2 font-yb-serif text-[26px] leading-tight">{spotlight.title}</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-yb-paper/75">
              <span className="tabular-nums">{hhmm(spotlight.start_time)}{spotlight.end_time && `–${hhmm(spotlight.end_time)}`}</span>
              {spotlight.place && <span className="flex items-center gap-1"><MapPin size={13} />{spotlight.place}</span>}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-yb-rule p-5">
            <div className="font-yb-serif text-xl">Día libre</div>
            <p className="mt-1 text-sm text-yb-ink-muted">
              {schedule.length ? 'Ya terminó la agenda de hoy. ¡Descansa!' : 'Cuando tu festival publique su programa, verás aquí lo que sigue.'}
            </p>
          </div>
        )}
      </div>

      {/* Horario */}
      {schedule.length > 0 && (
        <Block title="Horario" aside={
          <Link to="/estudiante" onClick={onNavigate} className="text-xs font-semibold hover:text-yb-forest">Mis clases</Link>
        }>
          <ol className="relative ml-1 border-l border-yb-rule">
            {schedule.map((s) => {
              const past = s.start !== null && (s.end ?? s.start + 60) <= now;
              const isLive = s === live;
              return (
                <li key={s.id} className={`relative pb-4 pl-5 last:pb-0 ${past ? 'opacity-45' : ''}`}>
                  <span className={`absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full border-2 border-yb-paper ${isLive ? 'bg-yb-forest' : past ? 'bg-yb-rule' : 'bg-yb-ink'}`} />
                  <div className="flex items-baseline gap-3">
                    <span className="w-11 shrink-0 text-xs font-semibold tabular-nums">{hhmm(s.start_time)}</span>
                    <div className="min-w-0">
                      <div className={`truncate text-sm ${isLive ? 'font-semibold text-yb-forest' : ''}`}>{s.title}</div>
                      {s.place && <div className="truncate text-xs text-yb-ink-muted">{s.place}</div>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Block>
      )}

      {/* Boletos */}
      <Block title="Mis boletos">
        {data === null ? <Skeleton /> : data.tickets.length === 0 ? (
          <Link to="/cursos" onClick={onNavigate} className="flex items-center justify-between border border-yb-rule bg-white p-4 text-sm hover:border-yb-ink/40">
            <span>Aún no tienes boletos. <span className="font-semibold">Explorar festivales</span></span>
            <ChevronRight size={16} />
          </Link>
        ) : (
          <ul className="space-y-2">
            {data.tickets.map((t) => (
              <li key={t.ticket_token ?? 'ejemplo'}>
                <Link to={t.sample ? '#' : `/ticket/${t.ticket_token}`} onClick={(e) => { if (t.sample) e.preventDefault(); else onNavigate?.(); }}
                  aria-disabled={t.sample || undefined}
                  className={`group flex items-center gap-3 border bg-white p-3 transition-colors ${t.sample ? 'cursor-default border-dashed border-yb-ink/25' : 'border-yb-rule hover:border-yb-ink/40'}`}>
                  <EventAvatar title={t.event.title} size="h-10 w-10 text-sm" ring={false} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-semibold">{t.event.title}</div>
                    <div className="mt-0.5 truncate text-xs text-yb-ink-muted">
                      {[t.ticket_type_name, t.event.date].filter(Boolean).join(' · ') || 'Boleto general'}
                    </div>
                  </div>
                  {t.pending_payment
                    ? <span className="shrink-0 bg-yb-laton/25 px-2 py-0.5 text-[11px] font-semibold text-yb-madera">Pago pendiente</span>
                    : t.checked_in
                      ? <span className="shrink-0 text-[11px] font-semibold text-yb-forest">✓ Entraste</span>
                      : <Ticket size={18} strokeWidth={1.6} className="shrink-0 text-yb-ink-muted group-hover:text-yb-ink" />}
                </Link>
                {t.has_certificate && (
                  <a href={`/api/certificates/download/${t.ticket_token}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 border border-t-0 border-yb-rule bg-yb-laton/15 px-3 py-2 text-xs font-semibold text-yb-madera transition-colors hover:bg-yb-laton/30">
                    <Award size={14} /> Descargar mi constancia
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Block>

      {/* Fijados */}
      {data?.pinned?.length > 0 && (
        <Block title="Anuncios fijados">
          <ul className="space-y-3">
            {data.pinned.map((p) => (
              <li key={p.id} className="flex gap-3">
                <Pin size={14} className="mt-0.5 shrink-0 text-yb-forest" />
                <div className="min-w-0 leading-snug">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-yb-ink-muted">{p.event.title}</div>
                </div>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Atajos */}
      <Block title="Atajos">
        <div className="grid grid-cols-3 gap-2">
          {[['/estudiante', CalendarDays, 'Clases'], ['/mis-concursos', Trophy, 'Resultados'], ['/cursos', Compass, 'Festivales']].map(([to, Icon, label]) => (
            <Link key={to} to={to} onClick={onNavigate}
              className="flex flex-col items-center gap-1.5 border border-yb-rule bg-white py-3 text-xs transition-colors hover:border-yb-ink/40">
              <Icon size={18} strokeWidth={1.6} />{label}
            </Link>
          ))}
        </div>
      </Block>

      <p className="mt-8 text-[11px] text-yb-ink-muted/80">© {new Date().getFullYear()} Yuuban · Xalapa, Veracruz</p>
    </div>
  );
};

export default StudentPanel;
