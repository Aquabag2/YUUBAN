import { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, Calendar, Zap,
  CheckCircle2, PauseCircle, Plus, DollarSign,
  Activity, BarChart3, X, ExternalLink, Trash2,
  Edit3, Mail, ToggleLeft, ToggleRight, Search,
  Globe, Lock, Award,
} from 'lucide-react';
import CertificateEditor from './CertificateEditor';
import api from '../lib/api';

const PLAN_BADGE = {
  Básico:     'border-gray-200 bg-gray-100 text-gray-600',
  Pro:        'border-violet-200 bg-violet-50 text-violet-700',
  Enterprise: 'border-amber-200 bg-amber-50 text-amber-700',
};
const PLAN_MRR = { Básico: 200, Pro: 600, Enterprise: 1200 };
const PLANS    = ['Básico', 'Pro', 'Enterprise'];

const STATUS_CONFIG = {
  Activo:  { icon: CheckCircle2, badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  Pausado: { icon: PauseCircle,  badge: 'border-amber-200 bg-amber-50 text-amber-700' },
};

const EMPTY_FORM = { name: '', contact: '', email: '', plan: 'Básico', mrr: '200', notes: '' };

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-gray-50 disabled:text-gray-400 transition-all';

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <>
    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  </>
);

// ── ClientForm ────────────────────────────────────────────────────────────────
const ClientForm = ({ initial = EMPTY_FORM, onSave, onCancel, saving, isEdit = false }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [error, setError] = useState('');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try { await onSave(form); }
    catch (err) { setError(err.response?.data?.error ?? err.message ?? 'Error desconocido'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Nombre del cliente / festival *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="Ej. Festival de Verano" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Contacto</label>
          <input value={form.contact} onChange={(e) => set('contact', e.target.value)}
            placeholder="Nombre del responsable" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Email *</label>
          <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
            disabled={isEdit} placeholder="admin@festival.com" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Plan</label>
          <select value={form.plan}
            onChange={(e) => { set('plan', e.target.value); set('mrr', PLAN_MRR[e.target.value]); }}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all">
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">MRR (USD)</label>
          <input type="number" min="0" value={form.mrr} onChange={(e) => set('mrr', e.target.value)}
            className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Notas internas</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
            rows={2} placeholder="Contexto, acuerdos especiales, etc."
            className={`${inputCls} resize-none`} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</div>
      )}
      {!isEdit && (
        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-700">
          <Mail size={13} /> Se enviará una invitación al email para configurar su contraseña.
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 rounded-xl bg-[#7C3AED] py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors shadow-sm shadow-violet-200">
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear e invitar'}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-gray-200 px-4 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const SuperAdmin = () => {
  const [metrics,    setMetrics]    = useState(null);
  const [clients,    setClients]    = useState([]);
  const [events,     setEvents]     = useState([]);
  const [evFilter,   setEvFilter]   = useState('activos'); // 'activos' | 'borrador' | 'todos'
  const [evSearch,   setEvSearch]   = useState('');
  const [managingEv, setManagingEv] = useState(null); // event being edited on behalf
  const [evForm,     setEvForm]     = useState({});
  const [savingEv,   setSavingEv]   = useState(false);

  const [search,     setSearch]     = useState('');
  const [showNew,    setShowNew]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const loadAll = () => {
    api.get('/super/metrics').then((r) => setMetrics(r.data)).catch(() => {});
    api.get('/super/clients').then((r) => setClients(r.data ?? [])).catch(() => {});
    api.get('/super/events').then((r)  => setEvents(r.data ?? [])).catch(() => {});
  };
  useEffect(() => { loadAll(); }, []);

  // ── Gestionar evento de un cliente ─────────────────────────────────────────
  const openManage = (ev) => {
    setManagingEv(ev);
    setEvForm({
      title:       ev.title       ?? '',
      location:    ev.location    ?? '',
      date:        ev.date        ?? '',
      summary:     ev.summary     ?? '',
      slug:        ev.slug        ?? '',
      is_published:ev.is_published ?? false,
      price_cents: ev.price_cents  ?? 0,
    });
  };

  const saveEvent = async () => {
    setSavingEv(true);
    try {
      const { data } = await api.put(`/super/events/${managingEv.id}`, evForm);
      setEvents((p) => p.map((e) => e.id === data.id ? { ...e, ...data } : e));
      setManagingEv(null);
      flash('Evento actualizado.');
    } catch (err) {
      flash(err.response?.data?.error ?? 'Error al guardar.');
    } finally {
      setSavingEv(false);
    }
  };

  const flash = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3500); };

  const createClient = async (form) => {
    setSaving(true);
    try {
      const { data } = await api.post('/super/clients', form);
      setClients((p) => [data, ...p]);
      setShowNew(false);
      flash(data.message ?? 'Cliente creado.');
      loadAll();
    } finally { setSaving(false); }
  };

  const updateClient = async (form) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/super/clients/${editTarget.id}`, form);
      setClients((p) => p.map((c) => c.id === data.id ? data : c));
      setEditTarget(null);
      flash('Cliente actualizado.');
    } finally { setSaving(false); }
  };

  const toggleStatus = async (client) => {
    const next = client.status === 'Activo' ? 'Pausado' : 'Activo';
    const { data } = await api.put(`/super/clients/${client.id}`, { status: next });
    setClients((p) => p.map((c) => c.id === data.id ? data : c));
  };

  const deleteClient = async (id) => {
    await api.delete(`/super/clients/${id}`);
    setClients((p) => p.filter((c) => c.id !== id));
    setConfirmDel(null);
    flash('Cliente eliminado.');
    loadAll();
  };

  const filtered = clients.filter((c) =>
    search.trim() === '' ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const METRIC_DEFS = [
    { key: 'mrr',           label: 'MRR',             icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'activeClients', label: 'Clientes activos', icon: Users,      color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200'  },
    { key: 'totalEvents',   label: 'Eventos totales',  icon: Calendar,   color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
    { key: 'platformUptime',label: 'Uptime',           icon: Activity,   color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200'     },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <ShieldCheck size={18} className="text-amber-500" /> Super Administrador
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">Control total de la plataforma Yuuban.</p>
        </div>
        <button type="button" onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors shadow-sm shadow-violet-200">
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      {saveMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ {saveMsg}
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {METRIC_DEFS.map(({ key, label, icon: Icon, color, bg, border }) => (
          <div key={key} className={`rounded-2xl border ${border} ${bg} px-5 py-4`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500">{label}</div>
              <Icon size={15} className={`${color} opacity-60`} />
            </div>
            <div className={`mt-2 text-2xl font-bold ${color}`}>
              {metrics
                ? (metrics[key] ?? '—')
                : <span className="inline-block h-7 w-12 animate-pulse rounded-lg bg-white/60" />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Resumen rápido ── */}
      {metrics && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Zap size={13} /> Nuevos este mes
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">+{metrics.newThisMonth}</div>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <BarChart3 size={13} /> Bajas este mes
            </div>
            <div className="mt-1 text-2xl font-bold text-red-600">{metrics.churnThisMonth}</div>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700">
              <Activity size={13} /> Estado de plataforma
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">✓ Operando</div>
          </div>
        </div>
      )}

      {/* ── Lista de clientes ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* Header tabla */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Users size={15} className="text-violet-500" />
            Clientes
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              {clients.length}
            </span>
          </h3>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Buscar cliente…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Users size={22} className="text-gray-300" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400">
                {search ? 'Sin resultados' : 'Sin clientes aún'}
              </div>
              {!search && (
                <button type="button" onClick={() => setShowNew(true)}
                  className="mt-3 flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors mx-auto">
                  <Plus size={13} /> Crear el primer cliente
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((client) => {
              const st    = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.Activo;
              const event = client.events;
              const initials = client.name?.charAt(0)?.toUpperCase() ?? '?';

              return (
                <div key={client.id}
                  className="flex flex-col gap-3 px-6 py-4 hover:bg-gray-50 transition-colors sm:flex-row sm:items-center">

                  {/* Avatar + nombre */}
                  <div className="flex items-center gap-3 sm:w-56">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">{client.name}</div>
                      <div className="truncate text-xs text-gray-500">{client.contact || client.email}</div>
                    </div>
                  </div>

                  {/* Plan + estado */}
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${PLAN_BADGE[client.plan] ?? PLAN_BADGE.Básico}`}>
                      {client.plan}
                    </span>
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.badge}`}>
                      <st.icon size={11} /> {client.status}
                    </span>
                  </div>

                  {/* MRR + Alta */}
                  <div className="flex flex-1 items-center gap-6">
                    <div>
                      <div className="text-xs text-gray-400">MRR</div>
                      <div className="text-sm font-semibold text-emerald-600">
                        {client.mrr > 0 ? `$${client.mrr}` : '—'}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs text-gray-400">Alta</div>
                      <div className="text-sm text-gray-600">
                        {new Date(client.created_at).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {event?.slug && event.is_published && (
                      <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                        <ExternalLink size={11} /> Evento
                      </a>
                    )}

                    <button type="button" onClick={() => toggleStatus(client)}
                      title={client.status === 'Activo' ? 'Pausar' : 'Activar'}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        client.status === 'Activo'
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}>
                      {client.status === 'Activo'
                        ? <><ToggleRight size={13} /> Pausar</>
                        : <><ToggleLeft size={13} /> Activar</>}
                    </button>

                    <button type="button" onClick={() => setEditTarget(client)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                      <Edit3 size={13} />
                    </button>

                    {confirmDel === client.id ? (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => deleteClient(client.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                          ¿Confirmar?
                        </button>
                        <button type="button" onClick={() => setConfirmDel(null)}
                          className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-50 transition-colors">
                          No
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmDel(client.id)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-300 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && (
        <Modal title="Nuevo cliente" onClose={() => setShowNew(false)}>
          <ClientForm onSave={createClient} onCancel={() => setShowNew(false)} saving={saving} />
        </Modal>
      )}

      {editTarget && (
        <Modal title="Editar cliente" onClose={() => setEditTarget(null)}>
          <ClientForm initial={editTarget} onSave={updateClient} onCancel={() => setEditTarget(null)} saving={saving} isEdit />
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Sección: Cursos y Eventos de los clientes
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Calendar size={15} className="text-violet-500" />
            Cursos y Eventos
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              {events.length}
            </span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Filtro activos/borrador/todos */}
            <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5">
              {[
                { v: 'activos',  label: 'Activos' },
                { v: 'borrador', label: 'Borrador' },
                { v: 'todos',    label: 'Todos' },
              ].map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setEvFilter(v)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    evFilter === v
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={evSearch} onChange={(e) => setEvSearch(e.target.value)}
                placeholder="Buscar evento…"
                className="w-40 rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-7 pr-3 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
          </div>
        </div>

        {/* Lista */}
        {(() => {
          const visible = events.filter((e) => {
            const matchFilter =
              evFilter === 'activos'  ? e.is_published === true  :
              evFilter === 'borrador' ? e.is_published === false :
              true;
            const q = evSearch.toLowerCase();
            const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.client?.name?.toLowerCase().includes(q);
            return matchFilter && matchSearch;
          });

          if (visible.length === 0) return (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Calendar size={24} className="text-gray-200" />
              <div className="text-sm text-gray-400">
                {evSearch ? `Sin resultados para "${evSearch}"` : 'Sin eventos en esta categoría.'}
              </div>
            </div>
          );

          return (
            <div className="divide-y divide-gray-50">
              {visible.map((ev) => (
                <div key={ev.id} className="flex flex-col gap-3 px-6 py-4 hover:bg-gray-50 transition-colors sm:flex-row sm:items-center">

                  {/* Estado + título */}
                  <div className="flex items-center gap-3 sm:w-64">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      ev.is_published ? 'bg-emerald-50' : 'bg-gray-100'
                    }`}>
                      {ev.is_published
                        ? <Globe size={15} className="text-emerald-600" />
                        : <Lock  size={15} className="text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">{ev.title}</div>
                      <div className="text-xs text-gray-400">{ev.date || 'Sin fecha'}</div>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-2 sm:w-40">
                    {ev.client ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 max-w-full truncate">
                        <Users size={10} /> {ev.client.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Sin cliente</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-1 items-center gap-5 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">Inscritos</div>
                      <div className="font-semibold text-gray-700">{ev.total_registrations}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Pagados</div>
                      <div className="font-semibold text-emerald-600">{ev.paid_registrations}</div>
                    </div>
                    {ev.price_cents > 0 && (
                      <div>
                        <div className="text-xs text-gray-400">Recaudado</div>
                        <div className="font-semibold text-emerald-600">
                          ${(ev.revenue_cents / 100).toLocaleString('es-MX')}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-400">Estado</div>
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                        ev.is_published
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500'
                      }`}>
                        {ev.is_published ? 'Activo' : 'Borrador'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {ev.slug && ev.is_published && (
                      <a href={`/e/${ev.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition-colors">
                        <ExternalLink size={11} /> Ver
                      </a>
                    )}
                    <button type="button" onClick={() => openManage(ev)}
                      className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
                      <Edit3 size={11} /> Gestionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── Modal: Gestionar evento de cliente ── */}
      {managingEv && (
        <Modal
          title={`Gestionar: ${managingEv.client?.name ?? 'Evento'}`}
          onClose={() => setManagingEv(null)}
        >
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            <ShieldCheck size={13} /> Estás editando el evento de un cliente en su nombre.
          </div>

          <div className="space-y-3">
            {[
              ['title',    'Nombre del evento',     'text'],
              ['date',     'Fecha(s)',               'text'],
              ['location', 'Lugar',                  'text'],
              ['slug',     'URL pública (slug)',     'text'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
                <input value={evForm[key] ?? ''} onChange={(e) => setEvForm((p) => ({ ...p, [key]: e.target.value }))}
                  className={inputCls} />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Descripción</label>
              <textarea value={evForm.summary ?? ''} rows={2} onChange={(e) => setEvForm((p) => ({ ...p, summary: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Precio (MXN)</label>
                <input type="number" min="0" value={(evForm.price_cents ?? 0) / 100}
                  onChange={(e) => setEvForm((p) => ({ ...p, price_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                  className={inputCls} />
              </div>
              <div className="flex flex-col justify-end">
                <button type="button"
                  onClick={() => setEvForm((p) => ({ ...p, is_published: !p.is_published }))}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                    evForm.is_published
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}>
                  {evForm.is_published ? <><ToggleRight size={13} /> Publicado</> : <><ToggleLeft size={13} /> Borrador</>}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={saveEvent} disabled={savingEv}
              className="flex-1 rounded-xl bg-[#7C3AED] py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors">
              {savingEv ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setManagingEv(null)}
              className="rounded-xl border border-gray-200 px-4 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* ── Templates oficiales de constancias ──────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <Award size={18} className="text-violet-600" />
          <h2 className="font-semibold text-gray-900">Templates oficiales de constancias</h2>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Los templates que subas aquí estarán disponibles para todos tus clientes.
          Sube diseños con el branding de Yuuban y tus clientes los pueden usar directamente.
        </p>
        <CertificateEditor isPlatform />
      </div>

    </div>
  );
};

export default SuperAdmin;
