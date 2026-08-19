import { useState, useEffect } from 'react';
import { Users, CalendarCheck, Download } from 'lucide-react';
import api from '../lib/api';

const FALLBACK_SCHEDULE = [
  { id: 1, time_slot: '10:00 - 10:30', student: 'Camila Soto', room: 'Sala 1' },
  { id: 2, time_slot: '10:30 - 11:00', student: 'Diego Pérez', room: 'Sala 1' },
  { id: 3, time_slot: '11:00 - 11:30', student: 'Valeria Cruz', room: 'Sala 2' },
];

const Teacher = () => {
  const [schedule, setSchedule] = useState(FALLBACK_SCHEDULE);

  useEffect(() => {
    api.get('/student-schedules')
      .then((r) => { if (r.data?.length) setSchedule(r.data); })
      .catch(() => {});
  }, []);

  const downloadCalendar = () => {
    const pad = (v) => String(v).padStart(2, '0');
    const toIcs = (date, time) => {
      const [y, m, d] = date.split('-').map(Number);
      const [h, min] = time.split(':').map(Number);
      return `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`;
    };
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yuuban//ES',
      ...schedule.flatMap((item) => {
        const [start = '10:00', end = '10:30'] = (item.time_slot ?? '').split(' - ');
        const name = item.students?.name ?? item.student ?? 'Alumno';
        return [
          'BEGIN:VEVENT', `SUMMARY:Clase – ${name}`, `LOCATION:${item.room}`,
          `DTSTART:${toIcs('2026-03-12', start)}`, `DTEND:${toIcs('2026-03-12', end)}`, 'END:VEVENT',
        ];
      }),
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'yuuban-maestro.ics';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <Users size={20} className="text-violet-400" /> Vista para maestros
      </h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Horario */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <CalendarCheck size={16} className="text-violet-400" /> Mis clases del día
          </h3>
          <p className="mt-1 text-sm text-white/50">Horario personal y alumnos asignados.</p>
          <div className="mt-5 space-y-3">
            {schedule.map((item, i) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {item.students?.name ?? item.student}
                  </div>
                  <div className="text-xs text-white/40">{item.room}</div>
                </div>
                <span className="shrink-0 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-mono text-indigo-300">
                  {item.time_slot}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Exportar */}
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/30 to-indigo-900/20 p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <CalendarCheck size={16} className="text-violet-400" /> Calendario del maestro
          </h3>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            Exporta tu horario personal en formato .ics para agregarlo a Google Calendar, Apple Calendar u Outlook.
          </p>
          <div className="mt-5 space-y-2">
            {['Compatible con Google Calendar', 'Compatible con Apple Calendar', 'Compatible con Outlook'].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm text-white/60">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                {t}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={downloadCalendar}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            <Download size={15} /> Exportar mi calendario
          </button>
        </div>
      </div>
    </div>
  );
};

export default Teacher;
