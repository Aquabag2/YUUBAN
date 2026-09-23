import { useEffect, useState } from 'react';
import {
  Globe, Edit3, ExternalLink, Copy, CheckCheck,
  ToggleLeft, ToggleRight, Download, Search,
  Users, Plus, Trash2,
  ChevronLeft, Lock,
} from 'lucide-react';
import api from '../lib/api';

const COLORS = ['violet', 'emerald', 'amber', 'rose', 'indigo'];
const COLOR_DOTS = {
  violet: 'bg-violet-500', emerald: 'bg-emerald-500',
  amber:  'bg-amber-500',  rose:    'bg-rose-500', indigo: 'bg-indigo-500',
};
const EMPTY = { title: '', location: '', date: '', summary: '', slug: '', cover_color: 'violet', is_published: false, price: '' };
const toSlug = (str) => str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 60);
const fmtMXN = (cents) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(cents / 100);
const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-gray-50 disabled:text-gray-500 transition-all';

// ── Panel de un evento individual ─────────────────────────────────────────────
const EventEditor = ({ event: initialEvent, onBack, onCreate }) => {
  const [event,   setEvent]  = useState(initialEvent);
  const [form,    setForm]   = useState(initialEvent
    ? { ...EMPTY, ...initialEvent, price: initialEvent.price_cents ? initialEvent.price_cents / 100 : '' }
    : EMPTY);
  const [regs,    setRegs]   = useState([]);
  const [saving,  setSaving] = useState(false);
  const [editing, setEdit]   = useState(!initialEvent);
  const [copied,  setCopied] = useState(false);
  const [search,  setSearch] = useState('');
  const [filter,  setFilter] = useState('todos');
  const [msg,     setMsg]    = useState('');
  const [delConf, setDel]    = useState(false);

  useEffect(() => {
    if (!event?.id) return;
    api.get(`/my-event/${event.id}/registrations`)
      .then(r => setRegs(r.data ?? []))
      .catch(() => {});
  }, [event?.id]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const save = async () => {
    setSaving(true);
    try {
      const { price, ...rest } = form;
      const payload = { ...rest, price_cents: Math.round(parseFloat(price || 0) * 100) };
      if (!payload.slug && payload.title) payload.slug = toSlug(payload.title);
      const { data } = event?.id
        ? await api.put(`/my-event/${event.id}`, payload)
        : await api.post('/my-event', payload);
      setEvent(data);
      setForm({ ...EMPTY, ...data, price: data.price_cents ? data.price_cents / 100 : '' });
      setEdit(false);
      flash('ok');
      if (!initialEvent) onCreate(data); // notifica al padre que se creó
    } catch (err) {
      flash(err.response?.data?.error ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const togglePublish = async () => {
    const { data } = await api.put(`/my-event/${event.id}`, { is_published: !event.is_published });
    setEvent(data); setForm(p => ({ ...p, is_published: data.is_published }));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/e/${event?.slug}`).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const deleteEvent = async () => {
    await api.delete(`/my-event/${event.id}`);
    onBack(event.id); // elimina del padre y vuelve
  };

  const exportCSV = () => {
    const pc = event?.price_cents ?? 0;
    const rows = [['Nombre','Correo','Instrumento','Notas','Pago','Monto','Fecha'],
      ...regs.map(r => [r.name, r.email, r.instrument ?? '', r.notes ?? '',
        pc > 0 ? (r.paid ? 'Pagado' : 'Pendiente') : 'Gratuito',
        pc > 0 ? (r.paid ? (pc/100).toFixed(2) : '0.00') : '0.00',
        new Date(r.created_at).toLocaleDateString('es-MX')])];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `inscritos-${event?.slug ?? 'evento'}.csv`; a.click();
  };

  const pc = event?.price_cents ?? 0;
  const paidN = regs.filter(r => r.paid).length;
  const filtered = regs.filter(r => {
    const q = search.toLowerCase();
    const ms = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    const mf = filter === 'todos' ? true : filter === 'pagado' ? r.paid : filter === 'pendiente' ? !r.paid : true;
    return ms && mf;
  });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={13} /> Mis eventos
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{event?.title || 'Nuevo evento'}</h2>
            {event?.is_published
              ? <span className="text-xs text-emerald-600 font-medium">● Publicado</span>
              : <span className="text-xs text-gray-400">○ Borrador</span>}
          </div>
        </div>

        {event?.slug && (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={togglePublish}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${event.is_published ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
              {event.is_published ? <><ToggleRight size={13}/>Publicado</> : <><ToggleLeft size={13}/>Borrador</>}
            </button>
            <button onClick={copyLink} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
              {copied ? <><CheckCheck size={12} className="text-emerald-600"/>Copiado</> : <><Copy size={12}/>Copiar link</>}
            </button>
            <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
              <ExternalLink size={12}/> Ver página
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      {event?.id && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Inscritos',  value: regs.length,                              color: 'text-violet-600' },
            { label: 'Recaudado',  value: pc > 0 ? fmtMXN(paidN * pc) : '—',       color: 'text-emerald-600' },
            { label: 'Pagados',    value: paidN,                                     color: 'text-emerald-600' },
            { label: 'Pendientes', value: pc > 0 ? regs.length - paidN : '—',       color: 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-xs text-gray-500">{label}</div>
              <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900">{event ? 'Información del evento' : 'Crear evento'}</h3>
          {event && !editing && (
            <button onClick={() => setEdit(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              <Edit3 size={11}/> Editar
            </button>
          )}
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {[['title','Nombre del evento *','Festival de Verano 2026'],['date','Fecha(s)','12–14 Marzo 2026'],['location','Lugar','Auditorio Principal'],['slug','URL pública','festival-verano-2026']].map(([k,l,ph]) => (
            <div key={k}>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{l}</label>
              <input value={form[k]??''} placeholder={ph} disabled={!editing&&!!event}
                onChange={e => setForm(p=>({...p,[k]:e.target.value}))} className={inputCls}/>
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Descripción</label>
            <textarea value={form.summary??''} rows={3} disabled={!editing&&!!event}
              placeholder="Cuéntales a los asistentes de qué trata…"
              onChange={e => setForm(p=>({...p,summary:e.target.value}))}
              className={`${inputCls} resize-none`}/>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Precio MXN (0 = gratuito)</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-gray-400">$</span>
              <input type="number" min="0" value={form.price??''} placeholder="0" disabled={!editing&&!!event}
                onChange={e => setForm(p=>({...p,price:e.target.value}))} className={`${inputCls} pl-7`}/>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-500">Color de portada</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" disabled={!editing&&!!event}
                  onClick={() => setForm(p=>({...p,cover_color:c}))}
                  className={`h-8 w-8 rounded-full ${COLOR_DOTS[c]} transition-all disabled:cursor-default ${form.cover_color===c?'ring-2 ring-gray-900 ring-offset-2 scale-110':'opacity-40 hover:opacity-70'}`}/>
              ))}
            </div>
          </div>
        </div>

        {(editing || !event) && (
          <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
            <button onClick={save} disabled={saving}
              className="flex-1 rounded-xl bg-[#7C3AED] py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors shadow-sm shadow-violet-200">
              {saving ? 'Guardando…' : event ? 'Guardar cambios' : 'Crear evento'}
            </button>
            {editing && event && (
              <button onClick={() => { setEdit(false); setForm({...EMPTY,...event,price:event.price_cents?event.price_cents/100:''}); }}
                className="rounded-xl border border-gray-200 px-5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
            )}
          </div>
        )}
        {msg && (
          <div className={`mx-6 mb-4 rounded-xl px-4 py-2.5 text-xs ${msg==='ok'?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-600'}`}>
            {msg==='ok'?'✓ Guardado correctamente.':msg}
          </div>
        )}
      </div>

      {/* Inscritos */}
      {event?.id && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              Inscritos <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">{regs.length}</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar…"
                  className="w-44 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"/>
              </div>
              {pc > 0 && (
                <select value={filter} onChange={e=>setFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-xs text-gray-600 outline-none focus:border-violet-400 transition-all">
                  <option value="todos">Todos</option>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              )}
              {regs.length > 0 && (
                <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
                  <Download size={12}/> Exportar CSV
                </button>
              )}
            </div>
          </div>

          {regs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Users size={28} className="text-gray-200"/>
              <div className="text-sm text-gray-400">Aún no hay inscritos.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Nombre</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Correo</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400">Estado</th>
                    {pc > 0 && <th className="px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Monto</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i===filtered.length-1?'border-0':''}`}>
                      <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{r.name}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{r.email}</td>
                      <td className="px-4 py-3.5">
                        {pc > 0
                          ? r.paid
                            ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">✓ Pagado</span>
                            : <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">Pendiente</span>
                          : <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">Gratuito</span>}
                      </td>
                      {pc > 0 && <td className="px-4 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{r.paid ? fmtMXN(pc) : '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Zona peligrosa — eliminar */}
      {event?.id && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
          <h4 className="text-sm font-semibold text-red-700">Zona de peligro</h4>
          <p className="mt-1 text-xs text-red-500">Eliminar el evento borra todos sus datos. Esta acción no se puede deshacer.</p>
          <div className="mt-3 flex items-center gap-2">
            {delConf ? (
              <>
                <button onClick={deleteEvent} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors">Sí, eliminar</button>
                <button onClick={() => setDel(false)} className="rounded-xl border border-red-200 px-4 py-2 text-xs text-red-500 hover:bg-red-100 transition-colors">Cancelar</button>
              </>
            ) : (
              <button onClick={() => setDel(true)} className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs text-red-500 hover:bg-red-100 transition-colors">
                <Trash2 size={12}/> Eliminar evento
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Lista de eventos ───────────────────────────────────────────────────────────
const MyEventPanel = () => {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoad]    = useState(true);
  const [active,  setActive]  = useState(null); // null = lista, 'new' = crear, event = editar

  useEffect(() => {
    api.get('/my-event').then(r => {
      const list = Array.isArray(r.data) ? r.data : (r.data ? [r.data] : []);
      setEvents(list);
    }).catch(() => {}).finally(() => setLoad(false));
  }, []);

  const handleCreate = (newEvent) => {
    setEvents(p => [newEvent, ...p]);
    setActive(newEvent);
  };

  const handleDelete = (id) => {
    setEvents(p => p.filter(e => e.id !== id));
    setActive(null);
  };

  if (loading) return (
    <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100"/>)}</div>
  );

  // Vista de editor
  if (active) return (
    <EventEditor
      event={active === 'new' ? null : active}
      onBack={(deletedId) => { if (deletedId) handleDelete(deletedId); else setActive(null); }}
      onCreate={handleCreate}
    />
  );

  // Vista de lista
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mis Eventos</h2>
          <p className="mt-0.5 text-sm text-gray-500">Crea y gestiona todos tus festivales y cursos.</p>
        </div>
        <button onClick={() => setActive('new')}
          className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors shadow-sm shadow-violet-200">
          <Plus size={15}/> Nuevo evento
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Globe size={24} className="text-gray-300"/>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Aún no tienes eventos</div>
            <div className="mt-1 text-xs text-gray-400">Crea tu primer festival, curso o concurso</div>
          </div>
          <button onClick={() => setActive('new')}
            className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors shadow-sm shadow-violet-200">
            <Plus size={15}/> Crear primer evento
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(ev => (
            <button key={ev.id} onClick={() => setActive(ev)}
              className="flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-violet-300 hover:shadow-md transition-all">
              <div className="flex w-full items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  ev.cover_color === 'violet'  ? 'bg-violet-100'  :
                  ev.cover_color === 'emerald' ? 'bg-emerald-100' :
                  ev.cover_color === 'amber'   ? 'bg-amber-100'   :
                  ev.cover_color === 'rose'    ? 'bg-rose-100'    : 'bg-indigo-100'
                }`}>
                  {ev.is_published
                    ? <Globe size={18} className="text-emerald-600"/>
                    : <Lock  size={18} className="text-gray-400"/>}
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ev.is_published ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                  {ev.is_published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <div className="min-w-0 w-full">
                <div className="truncate font-semibold text-gray-900">{ev.title}</div>
                <div className="mt-0.5 text-xs text-gray-500">{ev.date || 'Sin fecha'} {ev.location ? `· ${ev.location}` : ''}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-violet-600 font-medium">
                Gestionar <ChevronLeft size={12} className="rotate-180"/>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventPanel;
