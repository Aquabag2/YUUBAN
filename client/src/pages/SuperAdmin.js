import { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, Calendar,
  CheckCircle2, PauseCircle, Plus,
  X, ExternalLink, Trash2,
  Edit3, ToggleLeft, ToggleRight, Search,
  Globe, Lock, Award, UserCog, Save, RefreshCw,
} from 'lucide-react';
import CertificateEditor from './CertificateEditor';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Qué puede hacer cada rol (se muestra en Usuarios y permisos)
const ROLE_INFO = {
  student:     { label: 'Alumno',        text: 'Se inscribe a festivales y ve su inicio, horario, boletos y constancias.' },
  admin:       { label: 'Administrador', text: 'Crea y gestiona sus propios eventos, inscritos, noticias y constancias.' },
  super_admin: { label: 'Super admin',   text: 'Control total: todos los eventos y clientes, y puede dar o quitar permisos.' },
};

const STATUS_CONFIG = {
  Activo:  { icon: CheckCircle2, badge: 'border-yb-rule bg-white text-yb-forest' },
  Pausado: { icon: PauseCircle,  badge: 'border-yb-rule bg-yb-paper text-yb-ink' },
};

const EMPTY_FORM = { name: '', contact: '', email: '', notes: '' };

const inputCls =
  'w-full rounded-[3px] border border-yb-rule bg-white px-4 py-2.5 text-sm text-yb-ink placeholder-yb-ink-muted outline-none focus:border-yb-rule focus:ring-2 focus:ring-yb-rule disabled:bg-yb-paper disabled:text-yb-ink-muted transition-all';

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <>
    <div className="fixed inset-0 z-40 bg-yb-ink/30" onClick={onClose} />
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[3px] border border-yb-rule bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-yb-rule px-6 py-4">
          <h3 className="font-semibold text-yb-ink">{title}</h3>
          <button type="button" onClick={onClose}
            className="rounded-[3px] p-1.5 text-yb-ink-muted hover:bg-yb-paper hover:text-yb-ink transition-colors">
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
          <label className="mb-1.5 block text-xs font-medium text-yb-ink-muted">Nombre del cliente / festival *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="Ej. Festival de Verano" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-yb-ink-muted">Contacto</label>
          <input value={form.contact} onChange={(e) => set('contact', e.target.value)}
            placeholder="Nombre del responsable" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-yb-ink-muted">Email *</label>
          <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
            disabled={isEdit} placeholder="admin@festival.com" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-yb-ink-muted">Notas internas</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
            rows={2} placeholder="Contexto, acuerdos, permisos especiales…"
            className={`${inputCls} resize-none`} />
        </div>
      </div>

      {error && (
        <div className="rounded-[3px] border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 rounded-[3px] bg-yb-forest py-2.5 text-sm font-semibold text-white hover:bg-yb-ink disabled:opacity-50 transition-colors">
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-[3px] border border-yb-rule px-4 text-sm text-yb-ink-muted hover:bg-yb-paper transition-colors">
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

  // ── Gestión de usuarios ────────────────────────────────────────────────────
  const [users,       setUsers]      = useState([]);
  const [usersLoad,   setUsersLoad]  = useState(false);
  const [usersSearch, setUsersSearch]= useState('');
  const [roleEdits,   setRoleEdits]  = useState({}); // { [userId]: role }
  const [savingRole,  setSavingRole] = useState({}); // { [userId]: bool }
  const { user: me } = useAuth();

  const loadAll = () => {
    api.get('/super/metrics').then((r) => setMetrics(r.data)).catch(() => {});
    api.get('/super/clients').then((r) => setClients(r.data ?? [])).catch(() => {});
    api.get('/super/events').then((r)  => setEvents(r.data ?? [])).catch(() => {});
  };

  const loadUsers = () => {
    setUsersLoad(true);
    api.get('/super/users').then((r) => {
      setUsers(r.data ?? []);
      const init = {};
      (r.data ?? []).forEach(u => { init[u.id] = u.role; });
      setRoleEdits(init);
    }).catch(() => {}).finally(() => setUsersLoad(false));
  };

  useEffect(() => { loadAll(); loadUsers(); }, []);

  const saveRole = async (userId) => {
    const target = users.find(u => u.id === userId);
    if (roleEdits[userId] === 'super_admin' &&
        !window.confirm(`¿Dar control total (super admin) a ${target?.email ?? 'este usuario'}?`)) return;
    setSavingRole(p => ({ ...p, [userId]: true }));
    try {
      await api.put(`/super/users/${userId}/role`, { role: roleEdits[userId] });
      setUsers(p => p.map(u => u.id === userId ? { ...u, role: roleEdits[userId] } : u));
      flash('Rol actualizado.');
    } catch (err) {
      flash(err.response?.data?.error ?? 'Error al actualizar rol.');
    } finally {
      setSavingRole(p => ({ ...p, [userId]: false }));
    }
  };

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
    { key: 'activeClients',  label: 'Clientes activos' },
    { key: 'totalEvents',    label: 'Eventos' },
    { key: 'newThisMonth',   label: 'Altas del mes' },
    { key: 'churnThisMonth', label: 'Bajas del mes' },
  ];
  const todayLabel = (() => {
    const t = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    return t.charAt(0).toUpperCase() + t.slice(1);
  })();

  return (
    <div className="space-y-12 font-yb-sans text-yb-ink">

      {/* ── Encabezado ── */}
      <header>
        <p className="animate-yb-rise text-xs font-medium text-yb-ink-muted motion-reduce:animate-none" style={{ animationDelay: '120ms' }}>{todayLabel}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div className="animate-yb-rise motion-reduce:animate-none" style={{ animationDelay: '210ms' }}>
            <h1 className="font-yb-serif text-[44px] leading-[1.02] tracking-[-0.01em] sm:text-[52px]">Plataforma</h1>
            <p className="mt-2 text-[15px] text-yb-ink-muted">Clientes, eventos y usuarios de Yuuban.</p>
          </div>
          <button type="button" onClick={() => setShowNew(true)}
            className="animate-yb-rise inline-flex items-center gap-2 rounded-[3px] bg-yb-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-yb-ink motion-reduce:animate-none" style={{ animationDelay: '300ms' }}>
            <Plus size={15} /> Nuevo cliente
          </button>
        </div>
        <div className="mt-8 h-px origin-left animate-yb-line bg-yb-ink/80 motion-reduce:animate-none" />
      </header>

      {saveMsg && (
        <div className="flex items-center gap-2 border-l-0 border-y border-yb-rule py-3 text-sm text-yb-ink">
          <CheckCircle2 size={15} className="text-yb-forest" /> {saveMsg}
        </div>
      )}

      {/* ── Cifras ── */}
      <section className="animate-yb-rise motion-reduce:animate-none" style={{ animationDelay: '390ms' }}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">Resumen</h2>
          {metrics && (
            <span className="flex items-center gap-2 text-xs text-yb-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-yb-forest" />
              Operando · uptime {metrics.platformUptime ?? '—'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 border-y border-yb-rule lg:grid-cols-4">
          {METRIC_DEFS.map(({ key, label }, i) => (
            <div key={key} className={`py-5 ${i % 2 ? 'border-l border-yb-rule pl-5' : 'pr-5'} ${i >= 2 ? 'border-t border-yb-rule lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l lg:pl-5' : ''}`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{label}</div>
              <div className="mt-2 font-yb-serif text-[40px] leading-none">
                {metrics
                  ? (metrics[key] ?? '—')
                  : <span className="inline-block h-9 w-12 animate-pulse bg-yb-rule" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Lista de clientes ── */}
      <div className="rounded-[3px] border border-yb-rule bg-white">

        {/* Header tabla */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-yb-rule px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-yb-ink">
            <Users size={15} className="text-yb-ink" />
            Clientes
            <span className="rounded-full bg-yb-paper px-2 py-0.5 text-xs font-medium text-yb-ink">
              {clients.length}
            </span>
          </h3>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-yb-ink-muted" />
            <input placeholder="Buscar cliente…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-[3px] border border-yb-rule bg-yb-paper py-2 pl-8 pr-3 text-xs text-yb-ink-muted placeholder-yb-ink-muted outline-none focus:border-yb-rule focus:bg-white focus:ring-2 focus:ring-yb-rule transition-all" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[3px] bg-yb-paper">
              <Users size={22} className="text-yb-rule" />
            </div>
            <div>
              <div className="text-sm font-medium text-yb-ink-muted">
                {search ? 'Sin resultados' : 'Sin clientes aún'}
              </div>
              {!search && (
                <button type="button" onClick={() => setShowNew(true)}
                  className="mt-3 flex items-center gap-1.5 rounded-[3px] border border-yb-rule bg-yb-paper px-4 py-2 text-sm font-medium text-yb-ink hover:bg-yb-paper transition-colors mx-auto">
                  <Plus size={13} /> Crear el primer cliente
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-yb-rule">
            {filtered.map((client) => {
              const st    = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.Activo;
              const event = client.events;
              const initials = client.name?.charAt(0)?.toUpperCase() ?? '?';

              return (
                <div key={client.id}
                  className="flex flex-col gap-3 px-6 py-4 hover:bg-yb-paper transition-colors sm:flex-row sm:items-center">

                  {/* Avatar + nombre */}
                  <div className="flex items-center gap-3 sm:w-56">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-yb-forest text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-yb-ink">{client.name}</div>
                      <div className="truncate text-xs text-yb-ink-muted">{client.contact || client.email}</div>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.badge}`}>
                      <st.icon size={11} /> {client.status}
                    </span>
                  </div>

                  {/* Alta */}
                  <div className="flex flex-1 items-center gap-6">
                    <div className="hidden sm:block">
                      <div className="text-xs text-yb-ink-muted">Alta</div>
                      <div className="text-sm text-yb-ink-muted">
                        {new Date(client.created_at).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                    {client.notes && (
                      <div className="min-w-0 flex-1 hidden md:block">
                        <div className="text-xs text-yb-ink-muted">Notas</div>
                        <div className="truncate text-sm text-yb-ink-muted">{client.notes}</div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {event?.slug && event.is_published && (
                      <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-[3px] border border-yb-rule px-2.5 py-1.5 text-xs text-yb-ink-muted hover:bg-yb-paper hover:text-yb-ink transition-colors">
                        <ExternalLink size={11} /> Evento
                      </a>
                    )}

                    <button type="button" onClick={() => toggleStatus(client)}
                      title={client.status === 'Activo' ? 'Pausar' : 'Activar'}
                      className={`flex items-center gap-1 rounded-[3px] border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        client.status === 'Activo'
                          ? 'border-yb-rule text-yb-ink-muted hover:bg-yb-paper hover:text-yb-ink'
                          : 'border-yb-forest/40 text-yb-forest hover:bg-yb-paper'
                      }`}>
                      {client.status === 'Activo'
                        ? <><ToggleRight size={13} /> Pausar</>
                        : <><ToggleLeft size={13} /> Activar</>}
                    </button>

                    <button type="button" onClick={() => setEditTarget(client)}
                      className="rounded-[3px] border border-yb-rule p-1.5 text-yb-ink-muted hover:bg-yb-paper hover:text-yb-ink transition-colors">
                      <Edit3 size={13} />
                    </button>

                    {confirmDel === client.id ? (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => deleteClient(client.id)}
                          className="rounded-[3px] border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                          ¿Confirmar?
                        </button>
                        <button type="button" onClick={() => setConfirmDel(null)}
                          className="rounded-[3px] border border-yb-rule px-2 py-1.5 text-xs text-yb-ink-muted hover:bg-yb-paper transition-colors">
                          No
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmDel(client.id)}
                        className="rounded-[3px] border border-yb-rule p-1.5 text-yb-rule hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors">
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
      <div className="rounded-[3px] border border-yb-rule bg-white">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-yb-rule px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-yb-ink">
            <Calendar size={15} className="text-yb-ink" />
            Cursos y Eventos
            <span className="rounded-full bg-yb-paper px-2 py-0.5 text-xs font-medium text-yb-ink">
              {events.length}
            </span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Filtro activos/borrador/todos */}
            <div className="flex rounded-[3px] border border-yb-rule bg-yb-paper p-0.5">
              {[
                { v: 'activos',  label: 'Activos' },
                { v: 'borrador', label: 'Borrador' },
                { v: 'todos',    label: 'Todos' },
              ].map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setEvFilter(v)}
                  className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    evFilter === v
                      ? 'bg-white text-yb-ink'
                      : 'text-yb-ink-muted hover:text-yb-ink'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-yb-ink-muted" />
              <input value={evSearch} onChange={(e) => setEvSearch(e.target.value)}
                placeholder="Buscar evento…"
                className="w-40 rounded-[3px] border border-yb-rule bg-yb-paper py-1.5 pl-7 pr-3 text-xs text-yb-ink-muted placeholder-yb-ink-muted outline-none focus:border-yb-rule focus:bg-white focus:ring-2 focus:ring-yb-rule transition-all" />
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
              <Calendar size={24} className="text-yb-rule" />
              <div className="text-sm text-yb-ink-muted">
                {evSearch ? `Sin resultados para "${evSearch}"` : 'Sin eventos en esta categoría.'}
              </div>
            </div>
          );

          return (
            <div className="divide-y divide-yb-rule">
              {visible.map((ev) => (
                <div key={ev.id} className="flex flex-col gap-3 px-6 py-4 hover:bg-yb-paper transition-colors sm:flex-row sm:items-center">

                  {/* Estado + título */}
                  <div className="flex items-center gap-3 sm:w-64">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] ${
                      ev.is_published ? 'bg-yb-paper' : 'bg-yb-paper'
                    }`}>
                      {ev.is_published
                        ? <Globe size={15} className="text-yb-forest" />
                        : <Lock  size={15} className="text-yb-ink-muted" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-yb-ink">{ev.title}</div>
                      <div className="text-xs text-yb-ink-muted">{ev.date || 'Sin fecha'}</div>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-2 sm:w-40">
                    {ev.client ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-yb-rule bg-yb-paper px-2.5 py-0.5 text-xs font-medium text-yb-ink max-w-full truncate">
                        <Users size={10} /> {ev.client.name}
                      </span>
                    ) : (
                      <span className="text-xs text-yb-rule">Sin cliente</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-1 items-center gap-5 text-sm">
                    <div>
                      <div className="text-xs text-yb-ink-muted">Inscritos</div>
                      <div className="font-semibold text-yb-ink-muted">{ev.total_registrations}</div>
                    </div>
                    <div>
                      <div className="text-xs text-yb-ink-muted">Pagados</div>
                      <div className="font-semibold text-yb-forest">{ev.paid_registrations}</div>
                    </div>
                    {ev.price_cents > 0 && (
                      <div>
                        <div className="text-xs text-yb-ink-muted">Recaudado</div>
                        <div className="font-semibold text-yb-forest">
                          ${(ev.revenue_cents / 100).toLocaleString('es-MX')}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-yb-ink-muted">Estado</div>
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                        ev.is_published
                          ? 'border-yb-rule bg-white text-yb-forest'
                          : 'border-yb-rule bg-yb-paper text-yb-ink-muted'
                      }`}>
                        {ev.is_published ? 'Activo' : 'Borrador'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {ev.slug && ev.is_published && (
                      <a href={`/e/${ev.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-[3px] border border-yb-rule px-2.5 py-1.5 text-xs text-yb-ink-muted hover:bg-yb-paper transition-colors">
                        <ExternalLink size={11} /> Ver
                      </a>
                    )}
                    <button type="button" onClick={() => openManage(ev)}
                      className="flex items-center gap-1 rounded-[3px] border border-yb-rule bg-yb-paper px-3 py-1.5 text-xs font-semibold text-yb-ink hover:bg-yb-paper transition-colors">
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
          <div className="mb-4 flex items-center gap-2 rounded-[3px] border border-yb-rule bg-yb-paper px-4 py-2.5 text-xs text-yb-ink">
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
                <label className="mb-1.5 block text-xs font-medium text-yb-ink-muted">{label}</label>
                <input value={evForm[key] ?? ''} onChange={(e) => setEvForm((p) => ({ ...p, [key]: e.target.value }))}
                  className={inputCls} />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-yb-ink-muted">Descripción</label>
              <textarea value={evForm.summary ?? ''} rows={2} onChange={(e) => setEvForm((p) => ({ ...p, summary: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-yb-ink-muted">Precio (MXN)</label>
                <input type="number" min="0" value={(evForm.price_cents ?? 0) / 100}
                  onChange={(e) => setEvForm((p) => ({ ...p, price_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                  className={inputCls} />
              </div>
              <div className="flex flex-col justify-end">
                <button type="button"
                  onClick={() => setEvForm((p) => ({ ...p, is_published: !p.is_published }))}
                  className={`flex items-center justify-center gap-1.5 rounded-[3px] border py-2.5 text-xs font-semibold transition-colors ${
                    evForm.is_published
                      ? 'border-yb-rule bg-white text-yb-forest hover:bg-yb-paper'
                      : 'border-yb-rule bg-yb-paper text-yb-ink-muted hover:bg-yb-paper'
                  }`}>
                  {evForm.is_published ? <><ToggleRight size={13} /> Publicado</> : <><ToggleLeft size={13} /> Borrador</>}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={saveEvent} disabled={savingEv}
              className="flex-1 rounded-[3px] bg-yb-forest py-2.5 text-sm font-semibold text-white hover:bg-yb-ink disabled:opacity-50 transition-colors">
              {savingEv ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setManagingEv(null)}
              className="rounded-[3px] border border-yb-rule px-4 text-sm text-yb-ink-muted hover:bg-yb-paper transition-colors">
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Sección: Gestión de usuarios
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-[3px] border border-yb-rule bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-yb-rule px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-yb-ink">
            <UserCog size={15} className="text-yb-ink" />
            Usuarios y permisos
            <span className="rounded-full bg-yb-paper px-2 py-0.5 text-xs font-medium text-yb-ink">
              {users.length}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-yb-ink-muted" />
              <input value={usersSearch} onChange={e => setUsersSearch(e.target.value)}
                placeholder="Buscar usuario…"
                className="w-52 rounded-[3px] border border-yb-rule bg-yb-paper py-2 pl-8 pr-3 text-xs text-yb-ink-muted placeholder-yb-ink-muted outline-none focus:border-yb-rule focus:bg-white focus:ring-2 focus:ring-yb-rule transition-all"/>
            </div>
            <button onClick={loadUsers} title="Recargar"
              className="rounded-[3px] border border-yb-rule p-2 text-yb-ink-muted hover:bg-yb-paper hover:text-yb-ink transition-colors">
              <RefreshCw size={13} className={usersLoad ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="grid gap-px border-b border-yb-rule bg-yb-rule sm:grid-cols-3">
          {Object.entries(ROLE_INFO).map(([key, { label, text }]) => (
            <div key={key} className="bg-white px-6 py-4">
              <div className="text-xs font-semibold text-yb-ink">{label} <span className="ml-1 font-normal text-yb-ink-muted">· {users.filter(u => u.role === key).length}</span></div>
              <p className="mt-1 text-xs leading-relaxed text-yb-ink-muted">{text}</p>
            </div>
          ))}
        </div>

        {usersLoad && users.length === 0 ? (
          <div className="space-y-2 p-6">
            {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-[3px] bg-yb-paper"/>)}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Users size={24} className="text-yb-rule"/>
            <div className="text-sm text-yb-ink-muted">Sin usuarios registrados.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yb-rule text-left">
                  <th className="px-6 py-3 text-xs font-medium text-yb-ink-muted">Usuario</th>
                  <th className="px-4 py-3 text-xs font-medium text-yb-ink-muted hidden sm:table-cell">Alta</th>
                  <th className="px-4 py-3 text-xs font-medium text-yb-ink-muted">Rol</th>
                  <th className="px-4 py-3 text-xs font-medium text-yb-ink-muted"></th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => {
                    const q = usersSearch.toLowerCase();
                    return !q || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
                  })
                  .map((u, i, arr) => {
                    const changed = roleEdits[u.id] !== u.role;
                    const isMe = u.id === me?.id;
                    return (
                      <tr key={u.id} className={`hover:bg-yb-paper transition-colors ${i < arr.length - 1 ? 'border-b border-yb-rule' : ''}`}>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] bg-yb-paper text-xs font-bold text-yb-ink">
                              {u.email?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-yb-ink max-w-xs">{u.email ?? '—'}{isMe && <span className="ml-2 rounded-full bg-yb-ink px-2 py-0.5 text-[10px] font-semibold text-yb-paper">Tú</span>}</div>
                              <div className="text-xs text-yb-ink-muted">{u.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-yb-ink-muted hidden sm:table-cell">
                          {new Date(u.created_at).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            value={roleEdits[u.id] ?? u.role}
                            disabled={isMe}
                            title={isMe ? 'No puedes cambiar tu propio rol' : undefined}
                            onChange={e => setRoleEdits(p => ({ ...p, [u.id]: e.target.value }))}
                            className={`rounded-[3px] border px-3 py-1.5 text-xs font-medium outline-none transition-all focus:ring-2 focus:ring-yb-rule disabled:cursor-not-allowed disabled:opacity-60 ${
                              roleEdits[u.id] === 'super_admin' ? 'border-yb-ink bg-white text-yb-ink focus:border-yb-ink' :
                              roleEdits[u.id] === 'admin'       ? 'border-yb-rule bg-yb-paper text-yb-ink focus:border-yb-rule' :
                                                                   'border-yb-rule bg-yb-paper text-yb-ink-muted focus:border-yb-rule'
                            }`}>
                            {Object.entries(ROLE_INFO).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          {changed && (
                            <button onClick={() => saveRole(u.id)} disabled={savingRole[u.id]}
                              className="flex items-center gap-1.5 rounded-[3px] bg-yb-forest px-3 py-1.5 text-xs font-semibold text-white hover:bg-yb-ink disabled:opacity-50 transition-colors">
                              {savingRole[u.id] ? '…' : <><Save size={11}/> Guardar</>}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Templates oficiales de constancias ──────────────────── */}
      <div className="rounded-[3px] border border-yb-rule bg-white p-6">
        <div className="mb-1 flex items-center gap-2">
          <Award size={18} className="text-yb-ink" />
          <h2 className="font-semibold text-yb-ink">Templates oficiales de constancias</h2>
        </div>
        <p className="mb-5 text-sm text-yb-ink-muted">
          Los templates que subas aquí estarán disponibles para todos tus clientes.
          Sube diseños con el branding de Yuuban y tus clientes los pueden usar directamente.
        </p>
        <CertificateEditor isPlatform />
      </div>

    </div>
  );
};

export default SuperAdmin;
