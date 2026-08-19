import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, User, Music, Download, BookOpen, Star } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CLASS_COLORS = {
  'Piano':   { bg: 'from-violet-500/20 to-indigo-500/10', border: 'border-violet-500/30', icon: 'text-violet-400', dot: 'bg-violet-400' },
  'Guitarra': { bg: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30', icon: 'text-amber-400', dot: 'bg-amber-400' },
  'Violín':  { bg: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/30', icon: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Canto':   { bg: 'from-pink-500/20 to-rose-500/10', border: 'border-pink-500/30', icon: 'text-pink-400', dot: 'bg-pink-400' },
};
const DEFAULT_COLOR = { bg: 'from-slate-500/20 to-slate-500/10', border: 'border-slate-500/30', icon: 'text-slate-400', dot: 'bg-slate-400' };

const getColor = (instrument) => CLASS_COLORS[instrument] || DEFAULT_COLOR;

function ScheduleCard({ slot, index }) {
  const label = slot.students?.name || slot.student || `Clase ${index + 1}`;
  const instrument = slot.instrument || 'Clase';
  const color = getColor(instrument);

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${color.border} bg-gradient-to-br ${color.bg} p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${color.icon}`}>
          <Music size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${color.dot}`} />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{instrument}</span>
          </div>
          <div className="font-semibold text-white truncate">{label}</div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {slot.time_slot}
            </span>
            {slot.room && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {slot.room}
              </span>
            )}
            {(slot.teachers?.name || slot.teacher_name) && (
              <span className="flex items-center gap-1">
                <User size={11} />
                {slot.teachers?.name || slot.teacher_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Student = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student-schedules').catch(() => ({ data: [] })),
      api.get('/event').catch(() => ({ data: null })),
    ]).then(([schedRes, evRes]) => {
      setSchedule(schedRes.data || []);
      setEvent(evRes.data || null);
    }).finally(() => setLoading(false));
  }, []);

  const firstName = user?.email?.split('@')[0] ?? 'Estudiante';
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const downloadSchedule = () => {
    if (!schedule.length) return;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Yuuban//Student Schedule//ES',
      ...schedule.flatMap((s, i) => [
        'BEGIN:VEVENT',
        `UID:student-slot-${i}@yuuban`,
        `SUMMARY:${s.students?.name || s.student || 'Clase'}`,
        `DESCRIPTION:Sala: ${s.room || '—'}`,
        `LOCATION:${s.room || ''}`,
        'END:VEVENT',
      ]),
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-horario-yuuban.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">

      {/* ── Bienvenida ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-slate-900/50 border border-white/10 p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2 text-sm text-violet-300/80">
            <Star size={14} className="fill-violet-400 text-violet-400" />
            <span>Portal de Estudiante</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            {greeting}, <span className="text-violet-300 capitalize">{firstName}</span>
          </h1>
          {event && (
            <p className="mt-2 text-white/50 text-sm">
              {event.title} · {event.date} · {event.location}
            </p>
          )}
        </div>
      </div>

      {/* ── Mi horario ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
              <Calendar size={16} className="text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Mi horario</h2>
            {!loading && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                {schedule.length} {schedule.length === 1 ? 'clase' : 'clases'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={downloadSchedule}
            disabled={!schedule.length}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <Download size={12} />
            Descargar .ics
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : schedule.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {schedule.map((slot, i) => (
              <ScheduleCard key={slot.id ?? i} slot={slot} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
              <BookOpen size={22} className="text-white/20" />
            </div>
            <div>
              <div className="font-medium text-white/30">Sin horario asignado</div>
              <div className="mt-0.5 text-xs text-white/20">El administrador asignará tus clases pronto</div>
            </div>
          </div>
        )}
      </section>

      {/* ── Info del festival ── */}
      {event && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <Music size={16} className="text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">El evento</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
            <h3 className="font-semibold text-white">{event.title}</h3>
            {event.summary && (
              <p className="mt-1 text-sm text-white/50">{event.summary}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/40">
              {event.date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-400/70" />
                  {event.date}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-indigo-400/70" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default Student;
