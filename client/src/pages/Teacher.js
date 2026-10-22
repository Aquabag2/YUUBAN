import { useState, useEffect, useRef } from 'react';
import { Camera, Download, Plus, Trash2, X, Loader2 } from 'lucide-react';
import api from '../lib/api';

/*
 * Maestros — plantilla con foto (para identificarlos en el festival),
 * clases del día y exportación de calendario. Estilo sobrio: papel, tinta, verde yb-forest.
 */

const FALLBACK_SCHEDULE = [
  { id: 1, time_slot: '10:00 - 10:30', student: 'Camila Soto', room: 'Sala 1' },
  { id: 2, time_slot: '10:30 - 11:00', student: 'Diego Pérez', room: 'Sala 1' },
  { id: 3, time_slot: '11:00 - 11:30', student: 'Valeria Cruz', room: 'Sala 2' },
];

const inputCls = 'w-full rounded-[3px] border border-yb-rule bg-white px-3.5 py-2.5 text-sm text-yb-ink placeholder-yb-ink-muted outline-none transition focus:border-yb-ink';

const Rise = ({ i = 0, className = '', children }) => (
  <div className={`animate-yb-rise motion-reduce:animate-none ${className}`} style={{ animationDelay: `${120 + i * 90}ms` }}>{children}</div>
);

const SectionTitle = ({ children, aside }) => (
  <div className="mb-1 flex items-center justify-between gap-4">
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{children}</h2>
    {aside}
  </div>
);

// Reduce la foto a máx. 900px y JPEG antes de subirla (rápido y ligero)
const compressImage = async (file) => {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
};

const initialsOf = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// ── Tarjeta de maestro ────────────────────────────────────────────────────────
const TeacherCard = ({ teacher, onPhoto, onDelete, busy }) => {
  const fileRef = useRef(null);
  const [confirm, setConfirm] = useState(false);

  return (
    <figure className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-yb-rule/60">
        {teacher.photo_url ? (
          <img src={teacher.photo_url} alt={`Foto de ${teacher.name}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-3 text-yb-ink-muted transition-colors hover:bg-yb-rule hover:text-yb-ink">
            <span className="font-yb-serif text-5xl text-yb-ink/70">{initialsOf(teacher.name)}</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold"><Camera size={14} /> Subir foto</span>
          </button>
        )}

        {teacher.photo_url && (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-yb-ink/80 py-2.5 text-xs font-semibold text-yb-paper opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100">
            <Camera size={14} /> Cambiar foto
          </button>
        )}

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-yb-paper/70">
            <Loader2 size={22} className="animate-spin text-yb-ink" />
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPhoto(teacher, f); }} />
      </div>

      <figcaption className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-yb-serif text-[22px] leading-tight text-yb-ink">{teacher.name}</div>
          <div className="truncate text-sm text-yb-ink-muted">{teacher.role || 'Maestro'}</div>
        </div>
        {confirm ? (
          <div className="flex shrink-0 items-center gap-1 text-xs">
            <button type="button" onClick={() => onDelete(teacher)} className="font-semibold text-red-700 hover:underline">Eliminar</button>
            <button type="button" onClick={() => setConfirm(false)} className="p-1 text-yb-ink-muted hover:text-yb-ink" aria-label="Cancelar"><X size={13} /></button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} aria-label={`Eliminar a ${teacher.name}`}
            className="shrink-0 p-1 text-yb-ink-muted opacity-0 transition-opacity hover:text-red-700 focus:opacity-100 group-hover:opacity-100">
            <Trash2 size={14} />
          </button>
        )}
      </figcaption>
    </figure>
  );
};

// ── Formulario para agregar maestro ───────────────────────────────────────────
const AddTeacher = ({ onCreate, onCancel }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pick = (f) => {
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try { await onCreate({ name: name.trim(), role: role.trim() }, photo); }
    catch (err) { setError(err.response?.data?.error ?? err.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="animate-yb-rise mb-8 grid gap-6 border border-yb-rule bg-white p-6 motion-reduce:animate-none sm:grid-cols-[140px_1fr]">
      <button type="button" onClick={() => fileRef.current?.click()}
        className="relative aspect-[4/5] w-full overflow-hidden bg-yb-paper text-yb-ink-muted transition-colors hover:text-yb-ink sm:w-[140px]">
        {preview
          ? <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
          : <span className="flex h-full flex-col items-center justify-center gap-2 text-xs font-semibold"><Camera size={18} /> Foto del rostro</span>}
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-yb-ink-muted">Nombre completo *</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Ana Morales" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-yb-ink-muted">Especialidad</span>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ej. Clarinete" className={inputCls} />
          </label>
        </div>
        <p className="text-xs text-yb-ink-muted">Usa una foto de frente, con el rostro bien visible. Se usa para identificar al maestro durante el festival.</p>
        {error && <p className="text-xs text-red-700">{error}</p>}
        <div className="mt-auto flex gap-3">
          <button type="submit" disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 rounded-[3px] bg-yb-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yb-ink disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />} Guardar maestro
          </button>
          <button type="button" onClick={onCancel} className="px-3 text-sm text-yb-ink-muted hover:text-yb-ink">Cancelar</button>
        </div>
      </div>
    </form>
  );
};

// ── Página ────────────────────────────────────────────────────────────────────
const Teacher = () => {
  const [schedule, setSchedule] = useState(FALLBACK_SCHEDULE);
  const [isSample, setIsSample] = useState(true);
  const [teachers, setTeachers] = useState(null);
  const [adding, setAdding]     = useState(false);
  const [busyId, setBusyId]     = useState(null);
  const [msg, setMsg]           = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  useEffect(() => {
    api.get('/student-schedules')
      .then((r) => { if (r.data?.length) { setSchedule(r.data); setIsSample(false); } })
      .catch(() => {});
    api.get('/teachers')
      .then((r) => setTeachers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTeachers([]));
  }, []);

  const uploadPhoto = async (teacher, file) => {
    setBusyId(teacher.id);
    try {
      const fd = new FormData();
      fd.append('photo', await compressImage(file));
      const { data } = await api.post(`/teachers/${teacher.id}/photo`, fd);
      setTeachers((p) => p.map((t) => (t.id === teacher.id ? { ...t, ...data } : t)));
      flash('Foto actualizada.');
    } catch (err) {
      flash(err.response?.data?.error ?? 'No se pudo subir la foto.');
    } finally {
      setBusyId(null);
    }
  };

  const createTeacher = async (fields, photo) => {
    const { data } = await api.post('/teachers', fields);
    setTeachers((p) => [...(p ?? []), data].sort((a, b) => a.name.localeCompare(b.name)));
    setAdding(false);
    if (photo) await uploadPhoto(data, photo);
    else flash('Maestro agregado.');
  };

  const deleteTeacher = async (teacher) => {
    try {
      await api.delete(`/teachers/${teacher.id}`);
      setTeachers((p) => p.filter((t) => t.id !== teacher.id));
    } catch {
      flash('No se pudo eliminar.');
    }
  };

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
    <div className="font-yb-sans text-yb-ink">

      {/* Encabezado */}
      <header className="mb-12">
        <Rise i={0}><p className="text-xs font-medium text-yb-ink-muted">Gestión</p></Rise>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <Rise i={1}>
            <h1 className="font-yb-serif text-[44px] leading-[1.02] tracking-[-0.01em] sm:text-[52px]">Maestros</h1>
            <p className="mt-2 text-[15px] text-yb-ink-muted">Quién enseña, cómo identificarlo y sus clases del día.</p>
          </Rise>
          {!adding && (
            <Rise i={2}>
              <button type="button" onClick={() => setAdding(true)}
                className="inline-flex items-center gap-2 rounded-[3px] bg-yb-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-yb-ink">
                <Plus size={15} /> Agregar maestro
              </button>
            </Rise>
          )}
        </div>
        <div className="mt-8 h-px origin-left animate-yb-line bg-yb-ink/80 motion-reduce:animate-none" />
      </header>

      {msg && <p className="mb-6 border-y border-yb-rule py-3 text-sm">{msg}</p>}

      {/* Plantilla */}
      <Rise i={3} className="mb-16">
        <SectionTitle aside={teachers && <span className="text-xs text-yb-ink-muted">{teachers.length} {teachers.length === 1 ? 'maestro' : 'maestros'}</span>}>
          Plantilla
        </SectionTitle>
        <div className="border-t border-yb-rule pt-6">
          {adding && <AddTeacher onCreate={createTeacher} onCancel={() => setAdding(false)} />}

          {teachers === null ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="aspect-[4/5] animate-pulse bg-yb-rule/60" />)}
            </div>
          ) : teachers.length === 0 && !adding ? (
            <div className="py-8">
              <p className="font-yb-serif text-2xl">Aún no hay maestros registrados.</p>
              <p className="mt-2 text-sm text-yb-ink-muted">Agrégalos con su foto para que el staff los reconozca el día del evento.</p>
              <button type="button" onClick={() => setAdding(true)}
                className="mt-5 text-sm font-semibold underline decoration-1 underline-offset-4 hover:text-yb-forest">
                Agregar el primero
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {teachers.map((t) => (
                <TeacherCard key={t.id} teacher={t} busy={busyId === t.id} onPhoto={uploadPhoto} onDelete={deleteTeacher} />
              ))}
            </div>
          )}
        </div>
      </Rise>

      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        {/* Clases del día */}
        <Rise i={4}>
          <SectionTitle aside={isSample && <span className="text-xs text-yb-ink-muted">Ejemplo</span>}>Clases del día</SectionTitle>
          <ol className="border-t border-yb-rule">
            {schedule.map((item) => (
              <li key={item.id} className="grid grid-cols-[110px_1fr] items-baseline gap-4 border-b border-yb-rule py-4 sm:grid-cols-[130px_1fr_auto]">
                <span className="text-sm font-semibold tabular-nums">{item.time_slot}</span>
                <span className="font-yb-serif text-xl leading-tight">{item.students?.name ?? item.student}</span>
                <span className="col-start-2 text-sm text-yb-ink-muted sm:col-start-auto">{item.room}</span>
              </li>
            ))}
          </ol>
        </Rise>

        {/* Calendario */}
        <Rise i={5}>
          <SectionTitle>Calendario</SectionTitle>
          <div className="border-t border-yb-rule pt-6">
            <p className="text-[15px] leading-relaxed text-yb-ink-muted">
              Descarga el horario en formato .ics para agregarlo a Google Calendar, Apple Calendar u Outlook.
            </p>
            <button type="button" onClick={downloadCalendar}
              className="mt-6 inline-flex items-center gap-2 rounded-[3px] border border-yb-ink px-5 py-3 text-sm font-semibold transition-colors hover:bg-yb-ink hover:text-yb-paper">
              <Download size={15} /> Exportar calendario
            </button>
          </div>
        </Rise>
      </div>
    </div>
  );
};

export default Teacher;
