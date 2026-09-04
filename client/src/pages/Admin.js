import { useState, useEffect } from 'react';
import {
  LayoutDashboard, MessageSquare, Users, GraduationCap,
  CalendarClock, Download, List, LayoutGrid, Plus, X, GitBranch, Trash2, Award,
} from 'lucide-react';
import api from '../lib/api';
import { useWorkflow } from '../context/WorkflowContext';
import WorkflowCard from '../components/WorkflowCard';
import CertificateEditor from './CertificateEditor';

const STATUS_COLORS = {
  'Abierto':    'border-emerald-200 bg-emerald-50 text-emerald-700',
  'En proceso': 'border-amber-200 bg-amber-50 text-amber-700',
  'Urgente':    'border-red-200 bg-red-50 text-red-700',
};

const EMPTY_ITEM    = { time: '', title: '', type: 'Clase', people: '', location: '' };
const EMPTY_TEACHER = { name: '', role: '', schedule: '' };
const EMPTY_STUDENT = { name: '', instrument: '', status: 'Activo' };

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all';

// ── Sub-components ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
      <Icon size={15} className="text-violet-500" /> {title}
    </h3>
    {action}
  </div>
);

const EmptyRow = ({ label }) => (
  <div className="px-6 py-10 text-center text-sm text-gray-400">{label}</div>
);

const AddForm = ({ fields, values, onChange, onSave, onCancel, saving }) => (
  <div className="border-b border-gray-100 bg-violet-50/50 p-4">
    <div className="grid gap-2 sm:grid-cols-3">
      {fields.map(({ key, placeholder }) => (
        <input key={key} value={values[key] ?? ''} placeholder={placeholder}
          onChange={(e) => onChange(key, e.target.value)}
          className={inputCls} />
      ))}
    </div>
    <div className="mt-2 flex gap-2">
      <button type="button" onClick={onSave} disabled={saving}
        className="rounded-xl bg-[#7C3AED] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors">
        {saving ? 'Guardando…' : 'Agregar'}
      </button>
      <button type="button" onClick={onCancel}
        className="rounded-xl border border-gray-200 px-4 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition-colors">
        Cancelar
      </button>
    </div>
  </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const Admin = () => {
  const { items, ordered, update, shift, add, remove } = useWorkflow();
  const [workflowView, setWorkflowView] = useState('list');
  const [showNewFlow,  setShowNewFlow]  = useState(false);
  const [newFlowItem,  setNewFlowItem]  = useState(EMPTY_ITEM);

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [sched,    setSched]    = useState([]);
  const [messages, setMessages] = useState([]);
  const [stats,    setStats]    = useState(null);

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher,     setNewTeacher]     = useState(EMPTY_TEACHER);
  const [savingTeacher,  setSavingTeacher]  = useState(false);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent,     setNewStudent]     = useState(EMPTY_STUDENT);
  const [savingStudent,  setSavingStudent]  = useState(false);

  useEffect(() => {
    api.get('/teachers').then((r)          => setTeachers(r.data ?? [])).catch(() => {});
    api.get('/students').then((r)          => setStudents(r.data ?? [])).catch(() => {});
    api.get('/student-schedules').then((r) => setSched(r.data ?? [])).catch(() => {});
    api.get('/messages').then((r)          => setMessages(r.data ?? [])).catch(() => {});
    api.get('/stats').then((r)             => setStats(r.data)).catch(() => {});
  }, []);

  const addTeacher = async () => {
    if (!newTeacher.name) return;
    setSavingTeacher(true);
    try {
      const { data } = await api.post('/teachers', newTeacher);
      setTeachers((p) => [...p, data]);
      setNewTeacher(EMPTY_TEACHER); setShowAddTeacher(false);
    } finally { setSavingTeacher(false); }
  };
  const delTeacher = async (id) => {
    await api.delete(`/teachers/${id}`);
    setTeachers((p) => p.filter((t) => t.id !== id));
  };

  const addStudent = async () => {
    if (!newStudent.name) return;
    setSavingStudent(true);
    try {
      const { data } = await api.post('/students', newStudent);
      setStudents((p) => [...p, data]);
      setNewStudent(EMPTY_STUDENT); setShowAddStudent(false);
    } finally { setSavingStudent(false); }
  };
  const delStudent = async (id) => {
    await api.delete(`/students/${id}`);
    setStudents((p) => p.filter((s) => s.id !== id));
  };

  const delMessage = async (id) => {
    await api.delete(`/messages/${id}`);
    setMessages((p) => p.filter((m) => m.id !== id));
  };

  const downloadCalendar = () => {
    const pad  = (v) => String(v).padStart(2, '0');
    const toIcs = (time) => {
      const [h, min] = time.split(':').map(Number);
      return `20260312T${pad(h)}${pad(min)}00`;
    };
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yuuban//Calendario//ES',
      ...ordered.flatMap((item) => [
        'BEGIN:VEVENT', `SUMMARY:${item.title}`, `LOCATION:${item.location ?? ''}`,
        `DTSTART:${toIcs(item.time)}`, `DTEND:${toIcs(item.time)}`, 'END:VEVENT',
      ]),
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/calendar' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'yuuban-agenda.ics';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const STAT_DEFS = [
    { key: 'events',   label: 'Eventos activos',  color: 'text-violet-600' },
    { key: 'tickets',  label: 'Entradas vendidas', color: 'text-emerald-600' },
    { key: 'classes',  label: 'Actividades hoy',   color: 'text-amber-600' },
    { key: 'messages', label: 'Mensajes abiertos', color: 'text-red-500' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <LayoutDashboard size={18} className="text-violet-500" /> Panel de administración
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">Gestiona maestros, alumnos y el flujo del evento.</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_DEFS.map(({ key, label, color }) => (
          <div key={key} className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-xs text-gray-500">{label}</div>
            <div className={`mt-1 text-2xl font-bold ${color}`}>
              {stats
                ? (stats[key] ?? 0)
                : <span className="inline-block h-7 w-10 animate-pulse rounded-lg bg-gray-100" />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Mensajes ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader icon={MessageSquare} title="Mensajes y solicitudes"
          action={
            <button type="button"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              Conectar WhatsApp
            </button>
          }
        />
        {messages.length === 0
          ? <EmptyRow label="Sin mensajes por ahora." />
          : (
            <div className="divide-y divide-gray-50">
              {messages.map((m) => (
                <div key={m.id} className="group flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.note}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status] ?? 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                      {m.status}
                    </span>
                    <button type="button" onClick={() => delMessage(m.id)}
                      className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* ── Maestros + Alumnos ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Maestros */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={Users} title={`Maestros (${teachers.length})`}
            action={
              <button type="button" onClick={() => setShowAddTeacher((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
                {showAddTeacher ? <><X size={11} /> Cancelar</> : <><Plus size={11} /> Agregar</>}
              </button>
            }
          />
          {showAddTeacher && (
            <AddForm
              fields={[
                { key: 'name',     placeholder: 'Nombre *' },
                { key: 'role',     placeholder: 'Materia / Rol' },
                { key: 'schedule', placeholder: 'Horario (ej: Lun 10:00)' },
              ]}
              values={newTeacher}
              onChange={(k, v) => setNewTeacher((p) => ({ ...p, [k]: v }))}
              onSave={addTeacher}
              onCancel={() => { setShowAddTeacher(false); setNewTeacher(EMPTY_TEACHER); }}
              saving={savingTeacher}
            />
          )}
          {teachers.length === 0 && !showAddTeacher
            ? <EmptyRow label="Sin maestros. Agrega el primero arriba." />
            : (
              <div className="divide-y divide-gray-50">
                {teachers.map((t) => (
                  <div key={t.id} className="group flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        {t.schedule || '—'}
                      </span>
                      <button type="button" onClick={() => delTeacher(t.id)}
                        className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Alumnos */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={GraduationCap} title={`Alumnos (${students.length})`}
            action={
              <button type="button" onClick={() => setShowAddStudent((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
                {showAddStudent ? <><X size={11} /> Cancelar</> : <><Plus size={11} /> Agregar</>}
              </button>
            }
          />
          {showAddStudent && (
            <AddForm
              fields={[
                { key: 'name',       placeholder: 'Nombre *' },
                { key: 'instrument', placeholder: 'Instrumento' },
              ]}
              values={newStudent}
              onChange={(k, v) => setNewStudent((p) => ({ ...p, [k]: v }))}
              onSave={addStudent}
              onCancel={() => { setShowAddStudent(false); setNewStudent(EMPTY_STUDENT); }}
              saving={savingStudent}
            />
          )}
          {students.length === 0 && !showAddStudent
            ? <EmptyRow label="Sin alumnos. Agrega el primero arriba." />
            : (
              <div className="divide-y divide-gray-50">
                {students.map((s) => (
                  <div key={s.id} className="group flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.instrument}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        s.status === 'Activo'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}>
                        {s.status}
                      </span>
                      <button type="button" onClick={() => delStudent(s.id)}
                        className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* ── Agenda + Exportar ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={CalendarClock} title="Agenda del día" />
          {sched.length === 0
            ? <EmptyRow label="Sin clases programadas." />
            : (
              <div className="divide-y divide-gray-50">
                {sched.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <span className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono text-xs font-medium text-violet-700">
                      {item.time_slot}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.students?.name ?? item.student}</div>
                      <div className="text-xs text-gray-500">{item.room}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Exportar */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]">
              <Download size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Exportar horarios</h3>
              <p className="text-xs text-gray-500">Archivo .ics para Google Calendar</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            Descarga el horario del día y compártelo con maestros y alumnos directamente a su calendario.
          </p>
          <button type="button" onClick={downloadCalendar}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors shadow-sm shadow-violet-200">
            <Download size={14} /> Exportar al calendario
          </button>
        </div>
      </div>

      {/* ── Flujo de trabajo ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <GitBranch size={15} className="text-violet-500" /> Flujo de trabajo del día
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">Agrega y reordena actividades en tiempo real.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowNewFlow((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
              {showNewFlow ? <><X size={12} /> Cancelar</> : <><Plus size={12} /> Nueva actividad</>}
            </button>
            <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
              {[{ v: 'list', icon: List }, { v: 'grid', icon: LayoutGrid }, { v: 'flow', icon: GitBranch }].map(({ v, icon: Icon }) => (
                <button key={v} type="button" onClick={() => setWorkflowView(v)}
                  className={`rounded-lg p-1.5 transition-colors ${workflowView === v ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {showNewFlow && (
          <div className="border-b border-gray-100 bg-violet-50/40 p-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {[['time', 'Hora (HH:MM)'], ['title', 'Nombre de la actividad'], ['people', 'Maestros / alumnos'], ['location', 'Lugar / sala']].map(([key, ph]) => (
                <input key={key} value={newFlowItem[key]} placeholder={ph}
                  onChange={(e) => setNewFlowItem((p) => ({ ...p, [key]: e.target.value }))}
                  className={inputCls} />
              ))}
              <select value={newFlowItem.type}
                onChange={(e) => setNewFlowItem((p) => ({ ...p, type: e.target.value }))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-400 transition-all">
                {['Clase', 'Logística', 'Ensayo', 'Transporte'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button type="button"
              onClick={() => {
                if (!newFlowItem.time || !newFlowItem.title) return;
                add(newFlowItem); setNewFlowItem(EMPTY_ITEM); setShowNewFlow(false);
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#7C3AED] py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors">
              <Plus size={14} /> Agregar al flujo
            </button>
          </div>
        )}

        <div className="p-6">
          {(workflowView === 'flow' ? ordered : items).length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">Sin actividades. Agrega la primera arriba.</div>
          ) : workflowView === 'flow' ? (
            <div className="space-y-2">
              {ordered.map((item, idx) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1.5">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#7C3AED] ring-2 ring-violet-200" />
                    {idx < ordered.length - 1 && <div className="mt-1 flex-1 w-px bg-gray-200" />}
                  </div>
                  <div className="mb-2 flex-1 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <WorkflowCard item={item} onUpdate={update} onShift={shift} onDelete={remove} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-3 ${workflowView === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <WorkflowCard item={item} onUpdate={update} onShift={shift} onDelete={remove} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Constancias ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <Award size={18} className="text-violet-600" />
          <h2 className="font-semibold text-gray-900">Constancias de participación</h2>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Sube el diseño de tu constancia (PNG o PDF de Canva) y posiciona los campos con el editor.
          Cuando actives las constancias, cada alumno podrá descargar la suya desde su ticket.
        </p>
        <CertificateEditor />
      </div>

    </div>
  );
};

export default Admin;
