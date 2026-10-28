import { useEffect, useState } from 'react';
import { Download, MapPin, User } from 'lucide-react';
import api from '../lib/api';
import { Rise, PageTitle, SectionTitle, EmptyState } from '../components/yb';

/* Clases del alumno: horario como lista y datos del festival */
const Student = () => {
  const [schedule, setSchedule] = useState(null);
  const [event, setEvent]       = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/student-schedules').catch(() => ({ data: [] })),
      api.get('/event').catch(() => ({ data: null })),
    ]).then(([schedRes, evRes]) => {
      setSchedule(schedRes.data || []);
      setEvent(evRes.data || null);
    });
  }, []);

  const downloadSchedule = () => {
    if (!schedule?.length) return;
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yuuban//Student Schedule//ES',
      ...schedule.flatMap((s, i) => [
        'BEGIN:VEVENT', `UID:student-slot-${i}@yuuban`,
        `SUMMARY:${s.students?.name || s.student || 'Clase'}`,
        `DESCRIPTION:Sala: ${s.room || '—'}`, `LOCATION:${s.room || ''}`, 'END:VEVENT',
      ]),
      'END:VCALENDAR',
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    const a = document.createElement('a'); a.href = url; a.download = 'mi-horario-yuuban.ics'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-yb-sans text-yb-ink">
      <PageTitle kicker="Mi horario" title="Clases"
        subtitle={event ? [event.title, event.date, event.location].filter(Boolean).join(' · ') : 'Tus clases asignadas en el festival.'} />

      <Rise i={2}>
        <SectionTitle aside={schedule?.length > 0 && (
          <button type="button" onClick={downloadSchedule}
            className="flex items-center gap-1.5 text-xs font-semibold text-yb-ink underline decoration-1 underline-offset-4 hover:text-yb-forest">
            <Download size={12} /> Agregar a mi calendario
          </button>
        )}>
          {schedule ? `${schedule.length} ${schedule.length === 1 ? 'clase' : 'clases'}` : 'Cargando'}
        </SectionTitle>

        {schedule === null ? (
          <div className="space-y-2 border-t border-yb-rule pt-4">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-yb-rule/60" />)}</div>
        ) : schedule.length === 0 ? (
          <EmptyState title="Aún no tienes clases asignadas." text="El equipo del festival te asignará tus clases pronto. Te avisaremos en Noticias." />
        ) : (
          <ol className="border-t border-yb-rule">
            {schedule.map((s, i) => (
              <li key={s.id ?? i} className="grid grid-cols-[96px_1fr] gap-4 border-b border-yb-rule py-5">
                <span className="pt-1 text-sm font-semibold tabular-nums">{s.time_slot}</span>
                <div className="min-w-0">
                  <div className="font-yb-serif text-[22px] leading-tight">{s.instrument || s.students?.name || s.student || `Clase ${i + 1}`}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-yb-ink-muted">
                    {s.room && <span className="flex items-center gap-1.5"><MapPin size={13} strokeWidth={1.6} />{s.room}</span>}
                    {(s.teachers?.name || s.teacher_name) && <span className="flex items-center gap-1.5"><User size={13} strokeWidth={1.6} />{s.teachers?.name || s.teacher_name}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Rise>

      {event?.summary && (
        <Rise i={3} className="mt-12">
          <SectionTitle>El festival</SectionTitle>
          <div className="border-t border-yb-rule pt-5">
            <h2 className="font-yb-serif text-2xl">{event.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-yb-ink-muted">{event.summary}</p>
          </div>
        </Rise>
      )}
    </div>
  );
};

export default Student;
