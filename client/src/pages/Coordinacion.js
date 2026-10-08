import { useState, useEffect, useRef } from 'react';
import {
  Users, CreditCard, Calendar, Search, Plus, Check, X,
  Trash2, Edit2, GraduationCap, Clock, DoorOpen, UserCheck, ChevronDown,
} from 'lucide-react';
import api from '../lib/api';

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all';

const selectCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all';

// ── Stat card ─────────────────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, color }) => {
  const c = {
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  icon: 'text-violet-500'  },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: 'text-amber-500'   },
    sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-700',     icon: 'text-sky-500'     },
  }[color];
  return (
    <div className={`flex items-center gap-3 rounded-2xl border ${c.border} ${c.bg} px-4 py-3.5`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border ${c.border}`}>
        <Icon size={16} className={c.icon} />
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`text-xl font-bold ${c.text}`}>{value ?? '—'}</div>
      </div>
    </div>
  );
};

// ── Schedule row (editable) ───────────────────────────────────────────────────
const SchedRow = ({ sched, students, teachers, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    student_id: sched.student_id ?? '',
    teacher_id: sched.teacher_id ?? '',
    time_slot:  sched.time_slot  ?? '',
    room:       sched.room       ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(sched.id, form);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <tr className="bg-violet-50/60">
        <td className="px-4 py-2.5">
          <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
            className={selectCls}>
            <option value="">Seleccionar alumno</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </td>
        <td className="px-4 py-2.5">
          <input value={form.time_slot} onChange={e => setForm(p => ({ ...p, time_slot: e.target.value }))}
            placeholder="Ej: Lun 10:00" className={inputCls} />
        </td>
        <td className="px-4 py-2.5">
          <input value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
            placeholder="Sala" className={inputCls} />
        </td>
        <td className="px-4 py-2.5">
          <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}
            className={selectCls}>
            <option value="">Sin asignar</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors">
              <Check size={11} /> {saving ? 'Guardando' : 'Guardar'}
            </button>
            <button onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition-colors">
              <X size={11} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
            {(sched.students?.name ?? '?')[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">{sched.students?.name ?? '—'}</span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono text-xs font-semibold text-violet-700">
          {sched.time_slot || '—'}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-gray-600">{sched.room || <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-3.5 text-sm text-gray-600">{sched.teachers?.name || <span className="text-gray-300">Sin asignar</span>}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(sched.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Add schedule form ─────────────────────────────────────────────────────────
const AddSchedForm = ({ students, teachers, onSave, onCancel }) => {
  const [form, setForm] = useState({ student_id: '', teacher_id: '', time_slot: '', room: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.student_id || !form.time_slot) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setForm({ student_id: '', teacher_id: '', time_slot: '', room: '' });
  };

  return (
    <tr className="bg-violet-50/70 border-b-2 border-violet-200">
      <td className="px-4 py-3">
        <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
          className={selectCls}>
          <option value="">Seleccionar alumno *</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <input value={form.time_slot} onChange={e => setForm(p => ({ ...p, time_slot: e.target.value }))}
          placeholder="Ej: Lun 10:00 *" className={inputCls} />
      </td>
      <td className="px-4 py-3">
        <input value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
          placeholder="Sala (opcional)" className={inputCls} />
      </td>
      <td className="px-4 py-3">
        <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}
          className={selectCls}>
          <option value="">Sin asignar</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button onClick={handleSave} disabled={saving || !form.student_id || !form.time_slot}
            className="flex items-center gap-1 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-40 transition-colors">
            <Plus size={11} /> {saving ? 'Guardando' : 'Agregar'}
          </button>
          <button onClick={onCancel}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition-colors">
            <X size={11} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Coordinacion = () => {
  const [tab,           setTab]           = useState('inscritos');
  const [registrations, setRegistrations] = useState([]);
  const [students,      setStudents]      = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [schedules,     setSchedules]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [showAddSched,  setShowAddSched]  = useState(false);
  const [togglingId,    setTogglingId]    = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.get('/registrations').then(r  => setRegistrations(r.data  ?? [])),
      api.get('/students').then(r       => setStudents(r.data       ?? [])),
      api.get('/teachers').then(r       => setTeachers(r.data       ?? [])),
      api.get('/student-schedules').then(r => setSchedules(r.data   ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  // ── Payment toggle ─────────────────────────────────────────────────────────
  const togglePaid = async (reg) => {
    setTogglingId(reg.id);
    try {
      const { data } = await api.patch(`/registrations/${reg.id}`, { paid: !reg.paid });
      setRegistrations(p => p.map(r => r.id === reg.id ? { ...r, paid: data.paid } : r));
    } finally {
      setTogglingId(null);
    }
  };

  // ── Schedule CRUD ──────────────────────────────────────────────────────────
  const addSched = async (form) => {
    try {
      const { data } = await api.post('/student-schedules', form);
      setSchedules(p => [...p, data]);
      setShowAddSched(false);
    } catch {}
  };

  const updateSched = async (id, form) => {
    try {
      const { data } = await api.put(`/student-schedules/${id}`, form);
      setSchedules(p => p.map(s => s.id === id ? data : s));
    } catch {}
  };

  const deleteSched = async (id) => {
    try {
      await api.delete(`/student-schedules/${id}`);
      setSchedules(p => p.filter(s => s.id !== id));
    } catch {}
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const total   = registrations.length;
  const paid    = registrations.filter(r => r.paid).length;
  const pending = total - paid;

  // ── Filter ────────────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredRegs = registrations.filter(r =>
    !q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
  );
  const filteredScheds = schedules.filter(s =>
    !q || s.students?.name?.toLowerCase().includes(q)
  );

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
            <UserCheck size={16} className="text-violet-600" />
          </div>
          Coordinación de alumnos
        </h1>
        <p className="mt-0.5 ml-10 text-sm text-gray-500">
          Gestiona inscripciones, pagos y horarios de clases.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Users}       label="Total inscritos"  value={loading ? null : total}         color="violet"  />
        <Stat icon={CreditCard}  label="Pagados"          value={loading ? null : paid}           color="emerald" />
        <Stat icon={Clock}       label="Pendientes pago"  value={loading ? null : pending}        color="amber"   />
        <Stat icon={Calendar}    label="Horarios asignados" value={loading ? null : schedules.length} color="sky" />
      </div>

      {/* ── Tabs + search ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          {[
            { key: 'inscritos', label: 'Inscritos', icon: GraduationCap },
            { key: 'horarios',  label: 'Horarios',  icon: Calendar },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); setSearch(''); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-white shadow-sm text-violet-700 border border-violet-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={14} /> {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === key ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {key === 'inscritos' ? total : schedules.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search + action */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'inscritos' ? 'Buscar inscrito…' : 'Buscar alumno…'}
              className="rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all w-52"
            />
          </div>
          {tab === 'horarios' && (
            <button onClick={() => setShowAddSched(v => !v)}
              className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors shadow-sm shadow-violet-200">
              {showAddSched ? <><X size={13} /> Cancelar</> : <><Plus size={13} /> Agregar horario</>}
            </button>
          )}
        </div>
      </div>

      {/* ── TAB: INSCRITOS ── */}
      {tab === 'inscritos' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            </div>
          ) : filteredRegs.length === 0 ? (
            <div className="py-14 text-center">
              <GraduationCap size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">{search ? 'Sin coincidencias' : 'No hay inscritos aún.'}</p>
              {!search && <p className="mt-1 text-xs text-gray-400">Comparte el link público del evento para recibir inscripciones.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Alumno</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Evento</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Instrumento</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Inscrito</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Check-in</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRegs.map((r) => (
                    <tr key={r.id} className="group hover:bg-gray-50/70 transition-colors">

                      {/* Alumno */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                            {r.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{r.name}</div>
                            <div className="text-xs text-gray-400">{r.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Evento */}
                      <td className="px-5 py-3.5">
                        {r.event ? (
                          <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                            {r.event.title ?? r.event.slug}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Instrumento */}
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {r.instrument || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Fecha */}
                      <td className="px-5 py-3.5 text-xs text-gray-400 tabular-nums">{fmtDate(r.created_at)}</td>

                      {/* Check-in */}
                      <td className="px-5 py-3.5">
                        {r.checked_in ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <Check size={12} /> Ingresó
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">Pendiente</span>
                        )}
                      </td>

                      {/* Pago — toggle */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => togglePaid(r)}
                          disabled={togglingId === r.id}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                            r.paid
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          } ${togglingId === r.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                        >
                          {r.paid
                            ? <><Check size={11} /> Pagado</>
                            : <><Clock size={11} /> Pendiente</>}
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: HORARIOS ── */}
      {tab === 'horarios' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Alumno</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Horario</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Sala</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Maestro</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {showAddSched && (
                    <AddSchedForm
                      students={students}
                      teachers={teachers}
                      onSave={addSched}
                      onCancel={() => setShowAddSched(false)}
                    />
                  )}
                  {filteredScheds.length === 0 && !showAddSched ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center">
                        <Calendar size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-sm text-gray-400">{search ? 'Sin coincidencias' : 'Sin horarios asignados.'}</p>
                        {!search && (
                          <button onClick={() => setShowAddSched(true)}
                            className="mt-3 flex items-center gap-1.5 mx-auto rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors">
                            <Plus size={13} /> Agregar el primero
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredScheds.map(s => (
                      <SchedRow
                        key={s.id}
                        sched={s}
                        students={students}
                        teachers={teachers}
                        onSave={updateSched}
                        onDelete={deleteSched}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Coordinacion;
