import { useEffect, useState } from 'react';
import {
  Globe, Edit3, ExternalLink, Copy, CheckCheck,
  ToggleLeft, ToggleRight, Download, Search,
  Users, Plus, Trash2, ChevronLeft, Lock, Trophy,
  Megaphone, Calendar, Star, Pin, Loader2, X, Check,
  DollarSign, Tag, MapPin, Clock, User, Ticket, CreditCard,
  Mail, Smartphone, Monitor, RotateCw, Eye, Award, QrCode, Receipt,
} from 'lucide-react';
import api from '../lib/api';

const COLORS     = ['violet', 'emerald', 'amber', 'rose', 'indigo'];
const COLOR_DOTS = { violet: 'bg-violet-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500', indigo: 'bg-indigo-500' };
const EMPTY_EV   = { title: '', location: '', date: '', summary: '', slug: '', cover_color: 'violet', is_published: false, price: '' };
const EMPTY_CT   = { name: '', category: '', location: '', date: '', deadline: '', results_date: '', judge: '', price: '' };
const EMPTY_TT   = { name: '', description: '', price: '', capacity: '', sort_order: '0', is_active: true };

const toSlug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').substring(0,60);
const fmtMXN = (c) => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0}).format(c/100);
const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-gray-50 disabled:text-gray-500 transition-all';

// ── Tipos de publicación ───────────────────────────────────────────────────────
const POST_TYPES = [
  { key:'announcement', label:'Anuncio',   icon: Megaphone },
  { key:'schedule',     label:'Horario',   icon: Calendar  },
  { key:'result',       label:'Resultado', icon: Star      },
  { key:'winner',       label:'Ganador',   icon: Trophy    },
];
const TYPE_STYLE = {
  announcement:'bg-blue-50 border-blue-200 text-blue-700',
  schedule:    'bg-violet-50 border-violet-200 text-violet-700',
  result:      'bg-amber-50 border-amber-200 text-amber-700',
  winner:      'bg-emerald-50 border-emerald-200 text-emerald-700',
};

// ── TAB: Noticias ─────────────────────────────────────────────────────────────
const NoticiasTab = ({ eventSlug }) => {
  const [posts,  setPosts]  = useState([]);
  const [load,   setLoad]   = useState(true);
  const [show,   setShow]   = useState(false);
  const [form,   setForm]   = useState({ title:'', content:'', type:'announcement', is_pinned:false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventSlug) { setLoad(false); return; }
    api.get(`/e/${eventSlug}/posts`)
      .then(r => setPosts(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoad(false));
  }, [eventSlug]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/e/${eventSlug}/posts`, form);
      setPosts(p => [data, ...p]);
      setForm({ title:'', content:'', type:'announcement', is_pinned:false });
      setShow(false);
    } catch {}
    setSaving(false);
  };

  const del = async (id) => {
    try { await api.delete(`/posts/${id}`); setPosts(p => p.filter(x => x.id !== id)); } catch {}
  };

  if (!eventSlug) return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
      Guarda el evento primero para poder publicar noticias.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Anuncia horarios, resultados y novedades para los inscritos.</p>
        <button onClick={() => setShow(v => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors">
          {show ? <><X size={13}/> Cancelar</> : <><Plus size={13}/> Nueva publicación</>}
        </button>
      </div>

      {show && (
        <form onSubmit={create} className="rounded-2xl border border-violet-200 bg-violet-50 p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map(t => (
              <button key={t.key} type="button"
                onClick={() => setForm(f => ({ ...f, type: t.key }))}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.type===t.key ? TYPE_STYLE[t.key] : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                <t.icon size={11}/> {t.label}
              </button>
            ))}
          </div>
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Título del anuncio *"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 bg-white"/>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Contenido (opcional)…" rows={3}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 resize-none bg-white"/>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="rounded"/>
            <Pin size={12}/> Fijar (aparece primero)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60 transition-colors">
              {saving ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>} Publicar
            </button>
            <button type="button" onClick={() => setShow(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      )}

      {load ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-300"/></div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
          Sin publicaciones. Crea la primera arriba.
        </div>
      ) : (
        <div className="space-y-2.5">
          {posts.map(post => {
            const TypeIcon = POST_TYPES.find(t => t.key === post.type)?.icon ?? Megaphone;
            return (
              <div key={post.id} className={`rounded-2xl border p-4 ${post.is_pinned ? 'border-violet-200 bg-violet-50/60' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[post.type] ?? TYPE_STYLE.announcement}`}>
                        <TypeIcon size={10}/> {POST_TYPES.find(t => t.key === post.type)?.label}
                      </span>
                      {post.is_pinned && <Pin size={11} className="text-violet-400"/>}
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{post.title}</p>
                    {post.content && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{post.content}</p>}
                  </div>
                  <button onClick={() => del(post.id)} className="shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── TAB: Concursos ────────────────────────────────────────────────────────────
const ContestCard = ({ ct, onEdit, onDelete }) => {
  const free = !ct.price_cents || ct.price_cents === 0;
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-violet-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">{ct.name}</h4>
            {ct.category && (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 uppercase tracking-wide">
                {ct.category}
              </span>
            )}
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${free ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {free ? 'Gratuito' : fmtMXN(ct.price_cents)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {ct.date     && <span className="flex items-center gap-1"><Calendar size={11}/> {ct.date}</span>}
            {ct.location && <span className="flex items-center gap-1"><MapPin size={11}/> {ct.location}</span>}
            {ct.judge    && <span className="flex items-center gap-1"><User size={11}/> {ct.judge}</span>}
            {ct.deadline && <span className="flex items-center gap-1"><Clock size={11}/> Inscr. hasta {ct.deadline}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(ct)} className="rounded-lg p-1.5 text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"><Edit3 size={14}/></button>
          <button onClick={() => onDelete(ct.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
        </div>
      </div>
    </div>
  );
};

const ContestForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial ?? EMPTY_CT);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">Nombre del concurso *</label>
          <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Concurso de Piano Clásico" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Categoría</label>
          <input value={form.category} onChange={e => f('category', e.target.value)} placeholder="Juvenil, Adulto, Infantil…" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Lugar</label>
          <input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Auditorio principal" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Fecha del concurso</label>
          <input value={form.date} onChange={e => f('date', e.target.value)} placeholder="15 Mar 2026" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Límite de inscripción</label>
          <input value={form.deadline} onChange={e => f('deadline', e.target.value)} placeholder="10 Mar 2026" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Fecha de resultados</label>
          <input value={form.results_date} onChange={e => f('results_date', e.target.value)} placeholder="20 Mar 2026" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Juez</label>
          <input value={form.judge} onChange={e => f('judge', e.target.value)} placeholder="Dr. Juan López" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Precio MXN (0 = gratuito)</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-gray-400">$</span>
            <input type="number" min="0" value={form.price} onChange={e => f('price', e.target.value)} placeholder="0" className={`${inputCls} pl-7`}/>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ ...form, price_cents: Math.round(parseFloat(form.price||0)*100) })}
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
          {initial ? 'Guardar cambios' : 'Crear concurso'}
        </button>
        <button onClick={onCancel} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
      </div>
    </div>
  );
};

const ConcursosTab = ({ eventId }) => {
  const [contests, setContests] = useState([]);
  const [load,     setLoad]     = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!eventId) { setLoad(false); return; }
    api.get(`/my-event/${eventId}/contests`)
      .then(r => setContests(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoad(false));
  }, [eventId]);

  const create = async (form) => {
    setSaving(true);
    try {
      const { data } = await api.post(`/my-event/${eventId}/contests`, form);
      setContests(p => [...p, data]);
      setShowAdd(false);
    } catch {}
    setSaving(false);
  };

  const update = async (form) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/contests/${editing.id}`, form);
      setContests(p => p.map(c => c.id === editing.id ? data : c));
      setEditing(null);
    } catch {}
    setSaving(false);
  };

  const del = async (id) => {
    try { await api.delete(`/contests/${id}`); setContests(p => p.filter(c => c.id !== id)); } catch {}
  };

  if (!eventId) return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
      Guarda el evento primero para agregar concursos.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Cada concurso puede tener su propio precio, categoría y jurado.
        </p>
        {!showAdd && (
          <button onClick={() => { setShowAdd(true); setEditing(null); }}
            className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors">
            <Plus size={13}/> Nuevo concurso
          </button>
        )}
      </div>

      {showAdd && <ContestForm onSave={create} onCancel={() => setShowAdd(false)} saving={saving}/>}

      {load ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-300"/></div>
      ) : contests.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
          <Trophy size={28} className="text-gray-200"/>
          <div>
            <p className="text-sm text-gray-400">Sin concursos en este festival</p>
            <p className="mt-0.5 text-xs text-gray-300">Agrega hasta 5 concursos con diferentes categorías y precios</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors">
            <Plus size={13}/> Agregar primer concurso
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {contests.map(ct => (
            editing?.id === ct.id ? (
              <ContestForm
                key={ct.id}
                initial={{ ...ct, price: ct.price_cents ? ct.price_cents / 100 : '' }}
                onSave={update}
                onCancel={() => setEditing(null)}
                saving={saving}
              />
            ) : (
              <ContestCard key={ct.id} ct={ct} onEdit={setEditing} onDelete={del}/>
            )
          ))}
        </div>
      )}
    </div>
  );
};

// ── TAB: Vista previa (invitación y app del alumno incrustadas) ──────────────
const VIEWS = [
  { key: 'invitacion', label: 'Invitación',        hint: 'Donde se inscriben',          icon: Mail,       path: (s) => `/e/${s}` },
  { key: 'alumno',     label: 'Inicio del alumno', hint: 'Feed, horario y constancias', icon: Smartphone, path: (s) => `/vista-alumno/${s}` },
];

const VistaTab = ({ event, onGo }) => {
  const [view,   setView]   = useState('alumno');
  const [device, setDevice] = useState('cel');
  const [reload, setReload] = useState(0);
  const current = VIEWS.find((v) => v.key === view);
  const src = current.path(event.slug);

  const seg = (active) => `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`;

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {VIEWS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setView(key)} className={seg(view === key)}>
              <Icon size={13}/> {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button type="button" onClick={() => setDevice('cel')} className={seg(device === 'cel')} title="Celular"><Smartphone size={13}/></button>
            <button type="button" onClick={() => setDevice('pc')} className={seg(device === 'pc')} title="Escritorio"><Monitor size={13}/></button>
          </div>
          <button type="button" onClick={() => setReload((n) => n + 1)} title="Recargar"
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 transition-colors"><RotateCw size={14}/></button>
          <a href={src} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
            <ExternalLink size={12}/> Abrir completa
          </a>
        </div>
      </div>

      {!event.is_published && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          <Lock size={13}/> Está en borrador: solo tú puedes verla. Publícala para que tus alumnos entren.
        </div>
      )}

      <div className={device === 'cel' ? 'grid gap-8 lg:grid-cols-[auto_1fr]' : ''}>
        {/* Marco */}
        {device === 'cel' ? (
          <div className="mx-auto w-fit rounded-[46px] bg-gray-900 p-3 shadow-2xl shadow-gray-300 ring-1 ring-gray-800">
            <div className="relative overflow-hidden rounded-[34px] bg-white">
              <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-gray-900"/>
              <iframe key={`${src}-${reload}`} src={src} title={current.label} className="block h-[760px] w-[375px] border-0 sm:w-[390px]"/>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <div className="flex gap-1.5">{['bg-red-300', 'bg-amber-300', 'bg-emerald-300'].map((c) => <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`}/>)}</div>
              <div className="flex-1 truncate rounded-lg bg-white px-3 py-1 text-center text-xs text-gray-400 ring-1 ring-gray-200">
                {window.location.host}{src}
              </div>
            </div>
            <iframe key={`${src}-${reload}`} src={src} title={current.label} className="block h-[780px] w-full border-0"/>
          </div>
        )}

        {/* Guía al lado del celular */}
        {device === 'cel' && (
          <div className="space-y-4 lg:max-w-sm lg:pt-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-violet-600">{current.hint}</div>
              <h3 className="mt-1 text-lg font-bold text-gray-900">{current.label}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {view === 'alumno'
                  ? 'Así se ve el inicio de un alumno inscrito: las noticias del festival, su horario del día, su boleto y sus constancias cuando estén listas.'
                  : 'Así llega un invitado con tu link: ve el festival, el programa y se inscribe solo con su nombre.'}
              </p>
            </div>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {(view === 'alumno'
                ? [[Megaphone, 'Noticias y anuncios', 'Lo que publiques en Noticias', 'noticias'],
                   [Calendar, 'Horario', 'Las clases y actividades del día', null],
                   [Award, 'Constancias', 'Aparecen al generar su constancia', null],
                   [Ticket, 'Boleto QR', 'Aquí se ve uno de ejemplo', null]]
                : [[Ticket, 'Planes', 'Las opciones que eligen al inscribirse', 'planes'],
                   [Users, 'Inscritos', 'Cada inscripción llega a tu lista', 'inscritos'],
                   [Edit3, 'Datos del evento', 'Nombre, fecha, lugar y descripción', 'detalles']]
              ).map(([Icon, title, text, tab]) => (
                <li key={title}>
                  <button type="button" disabled={!tab} onClick={() => tab && onGo(tab)}
                    className="group flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors enabled:hover:border-violet-300 disabled:cursor-default">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Icon size={15}/></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-900">{title}</span>
                      <span className="block text-xs text-gray-400">{text}</span>
                    </span>
                    {tab && <span className="self-center text-xs font-semibold text-violet-600 opacity-0 transition-opacity group-hover:opacity-100">Editar →</span>}
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400">Lo que cambies se ve al instante: toca <RotateCw size={11} className="inline"/> para recargar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── TAB: Inscritos ────────────────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// Estado de pago de una inscripción
const payState = (r) => {
  if (r.price_cents > 0 || r.stripe_session_id) {
    if (r.paid) return r.stripe_session_id ? 'stripe' : 'pagado';
    return 'pendiente';
  }
  return 'gratis';
};
const PAY_BADGE = {
  stripe:    ['border-emerald-200 bg-emerald-50 text-emerald-700', 'Pagado'],
  pagado:    ['border-emerald-200 bg-emerald-50 text-emerald-700', 'Pagado'],
  pendiente: ['border-amber-200 bg-amber-50 text-amber-700',       'Pendiente'],
  gratis:    ['border-gray-200 bg-gray-50 text-gray-500',          'Gratis'],
};
const PayBadge = ({ r }) => {
  const st = payState(r);
  const [cls, label] = PAY_BADGE[st];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {st === 'stripe' && <CreditCard size={11}/>}{label}{st !== 'gratis' && r.price_cents > 0 && ` · ${fmtMXN(r.price_cents)}`}
    </span>
  );
};

const Detail = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
    <span className="shrink-0 text-gray-400">{label}</span>
    <span className="min-w-0 text-right font-medium text-gray-800 break-words">{children}</span>
  </div>
);

// Panel lateral con todo lo de un alumno, incluido su pago en Stripe
const RegDrawer = ({ eventId, reg, onClose }) => {
  const [pay, setPay] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPay(null);
    if (!reg.stripe_session_id) return;
    api.get(`/my-event/${eventId}/registrations/${reg.id}/payment`)
      .then((r) => setPay(r.data))
      .catch(() => setPay({ error: true }));
  }, [eventId, reg.id, reg.stripe_session_id]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copySession = () => {
    navigator.clipboard.writeText(reg.stripe_session_id).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px]"/>
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl animate-yb-sheet">
        <div className="flex items-start gap-3 border-b border-gray-100 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
            {reg.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-gray-900">{reg.name}</h3>
            <a href={`mailto:${reg.email}`} className="truncate text-sm text-violet-600 hover:underline">{reg.email}</a>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18}/></button>
        </div>

        <div className="space-y-6 p-6">
          {/* Estado rápido */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              [CreditCard, 'Pago',       <PayBadge r={reg}/>],
              [QrCode,     'Entrada',    reg.checked_in ? <span className="text-xs font-semibold text-emerald-600">✓ Entró</span> : <span className="text-xs text-gray-400">Aún no</span>],
              [Award,      'Constancia', reg.has_certificate ? <span className="text-xs font-semibold text-emerald-600">✓ Lista</span> : <span className="text-xs text-gray-400">Pendiente</span>],
            ].map(([Icon, label, value]) => (
              <div key={label} className="rounded-xl border border-gray-200 px-2 py-3">
                <Icon size={15} className="mx-auto text-gray-400"/>
                <div className="mt-1 text-[11px] text-gray-400">{label}</div>
                <div className="mt-1">{value}</div>
              </div>
            ))}
          </div>

          <section>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Inscripción</h4>
            <div className="divide-y divide-gray-100">
              <Detail label="Plan">{reg.ticket_type_name || 'General'}</Detail>
              <Detail label="Fecha">{fmtDate(reg.created_at)}</Detail>
              {reg.instrument && <Detail label="Instrumento">{reg.instrument}</Detail>}
              {reg.checked_in_at && <Detail label="Entró">{new Date(reg.checked_in_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</Detail>}
              {reg.notes && <Detail label="Notas">{reg.notes}</Detail>}
            </div>
          </section>

          {/* Pago en Stripe */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"><CreditCard size={12}/> Pago en Stripe</h4>
            {!reg.stripe_session_id ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-400">
                {payState(reg) === 'gratis' ? 'Inscripción gratuita, no hubo pago.' : reg.paid ? 'Marcado como pagado (sin pago en Stripe).' : 'Todavía no ha pagado.'}
              </div>
            ) : pay === null ? (
              <div className="h-32 animate-pulse rounded-xl bg-gray-100"/>
            ) : pay.error || pay.stripe_unavailable ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {pay.stripe_unavailable ? 'Stripe no está configurado en el servidor.' : 'No se pudo consultar Stripe ahora.'}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-5 py-4 text-white">
                  <div className="text-xs text-white/60">Total cobrado</div>
                  <div className="mt-0.5 text-2xl font-bold">{fmtMXN(pay.amount_cents ?? 0)} <span className="text-sm font-medium uppercase text-white/60">{pay.currency}</span></div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${pay.status === 'paid' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'}`}>
                      {pay.status === 'paid' ? 'Pagado' : pay.status === 'unpaid' ? 'Sin pagar' : pay.status}
                    </span>
                    {pay.refunded_cents > 0 && <span className="rounded-full bg-red-400/20 px-2 py-0.5 font-semibold text-red-200">Reembolsado {fmtMXN(pay.refunded_cents)}</span>}
                  </div>
                </div>
                <div className="divide-y divide-gray-100 px-5">
                  {pay.card && <Detail label="Tarjeta"><span className="capitalize">{pay.card.brand}</span> •••• {pay.card.last4}</Detail>}
                  {pay.created && <Detail label="Fecha">{new Date(pay.created * 1000).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</Detail>}
                  {pay.email && <Detail label="Correo de pago">{pay.email}</Detail>}
                  <Detail label="Sesión">
                    <button type="button" onClick={copySession} className="inline-flex items-center gap-1 font-mono text-xs text-gray-500 hover:text-gray-800">
                      {reg.stripe_session_id.slice(0, 14)}… {copied ? <CheckCheck size={12} className="text-emerald-600"/> : <Copy size={12}/>}
                    </button>
                  </Detail>
                </div>
                <div className="flex gap-2 border-t border-gray-100 bg-gray-50 p-3">
                  {pay.receipt_url && (
                    <a href={pay.receipt_url} target="_blank" rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"><Receipt size={13}/> Recibo</a>
                  )}
                  {pay.dashboard_url && (
                    <a href={pay.dashboard_url} target="_blank" rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#635BFF] py-2 text-xs font-semibold text-white hover:brightness-110"><ExternalLink size={13}/> Ver en Stripe</a>
                  )}
                </div>
              </div>
            )}
          </section>

          {reg.ticket_token && (
            <a href={`/ticket/${reg.ticket_token}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
              <QrCode size={15}/> Ver su boleto QR
            </a>
          )}
        </div>
      </aside>
    </div>
  );
};

const FILTERS = [
  { key: 'todos',     label: 'Todos',      test: () => true },
  { key: 'pagado',    label: 'Pagados',    test: (r) => ['stripe', 'pagado'].includes(payState(r)) },
  { key: 'pendiente', label: 'Pendientes', test: (r) => payState(r) === 'pendiente' },
  { key: 'gratis',    label: 'Gratis',     test: (r) => payState(r) === 'gratis' },
  { key: 'entraron',  label: 'Entraron',   test: (r) => r.checked_in },
];

const InscritosTab = ({ event, regs }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [open,   setOpen]   = useState(null);

  const paidRegs  = regs.filter(FILTERS[1].test);
  const collected = paidRegs.reduce((sum, r) => sum + (r.price_cents ?? 0), 0);

  const exportCSV = () => {
    const rows = [['Nombre','Correo','Plan','Instrumento','Pago','Monto','Sesión Stripe','Entró','Constancia','Fecha'],
      ...regs.map(r => [r.name, r.email, r.ticket_type_name ?? 'General', r.instrument ?? '',
        PAY_BADGE[payState(r)][1], r.price_cents ? r.price_cents / 100 : 0, r.stripe_session_id ?? '',
        r.checked_in ? 'Sí' : 'No', r.has_certificate ? 'Sí' : 'No',
        new Date(r.created_at).toLocaleDateString('es-MX')])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}));
    a.download = `inscritos-${event?.slug??'evento'}.csv`; a.click();
  };

  const q = search.trim().toLowerCase();
  const test = FILTERS.find((f) => f.key === filter).test;
  const filtered = regs.filter(r => test(r) && (!q || `${r.name} ${r.email} ${r.ticket_type_name ?? ''}`.toLowerCase().includes(q)));

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Alumnos inscritos', value: regs.length,                               icon: Users,      color: 'text-violet-600 bg-violet-50' },
          { label: 'Pagos recibidos',   value: paidRegs.length,                           icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Recaudado',         value: fmtMXN(collected),                         icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Ya entraron',       value: regs.filter(r => r.checked_in).length,      icon: QrCode,     color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={17}/></span>
            <div className="min-w-0">
              <div className="truncate text-xs text-gray-400">{label}</div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar alumno…"
              className="w-48 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-700 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"/>
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map(f => (
              <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === f.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {regs.length > 0 && (
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={12}/> Exportar CSV
          </button>
        )}
      </div>

      {regs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
          <Users size={28} className="text-gray-200"/>
          <p className="text-sm text-gray-400">Aún no hay inscritos.</p>
          <p className="text-xs text-gray-300">Comparte el link del evento para recibir inscripciones.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Alumno', 'Plan', 'Pago', 'Entrada', 'Constancia', 'Fecha'].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 ${['', 'hidden md:table-cell', '', 'hidden sm:table-cell', 'hidden lg:table-cell', 'hidden lg:table-cell'][i]}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setOpen(r)} className="cursor-pointer hover:bg-violet-50/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {r.name?.[0]?.toUpperCase()??'?'}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{r.name}</div>
                        <div className="truncate text-xs text-gray-400">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">{r.ticket_type_name || 'General'}</td>
                  <td className="px-5 py-3.5"><PayBadge r={r}/></td>
                  <td className="px-5 py-3.5 text-xs hidden sm:table-cell">{r.checked_in ? <span className="font-semibold text-emerald-600">✓ Entró</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5 text-xs hidden lg:table-cell">{r.has_certificate ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><Award size={12}/> Lista</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-400">Nadie coincide con ese filtro.</p>}
        </div>
      )}

      {open && <RegDrawer eventId={event.id} reg={open} onClose={() => setOpen(null)}/>}
    </div>
  );
};

// ── TAB: Planes de participación ──────────────────────────────────────────────
const PlanForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial ?? EMPTY_TT);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">Nombre del plan *</label>
          <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej. Oyente, Concursante, VIP…" className={inputCls}/>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">Descripción (aparece al usuario)</label>
          <input value={form.description} onChange={e => f('description', e.target.value)} placeholder="Solo asistir sin competir, incluye acceso a todas las presentaciones" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Precio MXN (0 = gratuito)</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-gray-400">$</span>
            <input type="number" min="0" value={form.price} onChange={e => f('price', e.target.value)} placeholder="0" className={`${inputCls} pl-7`}/>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Cupos máximos (vacío = sin límite)</label>
          <input type="number" min="1" value={form.capacity} onChange={e => f('capacity', e.target.value)} placeholder="Sin límite" className={inputCls}/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Orden de aparición</label>
          <input type="number" min="0" value={form.sort_order} onChange={e => f('sort_order', e.target.value)} placeholder="0" className={inputCls}/>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} className="rounded accent-violet-600"/>
            Activo (visible para los usuarios)
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ ...form, price_cents: Math.round(parseFloat(form.price||0)*100), capacity: form.capacity ? parseInt(form.capacity) : null, sort_order: parseInt(form.sort_order||0) })}
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
          {initial ? 'Guardar cambios' : 'Crear plan'}
        </button>
        <button onClick={onCancel} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
      </div>
    </div>
  );
};

const PlanesTab = ({ eventId }) => {
  const [plans,   setPlans]   = useState([]);
  const [load,    setLoad]    = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!eventId) { setLoad(false); return; }
    api.get(`/my-event/${eventId}/ticket-types`)
      .then(r => setPlans(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoad(false));
  }, [eventId]);

  const create = async (form) => {
    setSaving(true);
    try {
      const { data } = await api.post(`/my-event/${eventId}/ticket-types`, form);
      setPlans(p => [...p, data]);
      setShowAdd(false);
    } catch {}
    setSaving(false);
  };

  const update = async (form) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/ticket-types/${editing.id}`, form);
      setPlans(p => p.map(t => t.id === editing.id ? data : t));
      setEditing(null);
    } catch {}
    setSaving(false);
  };

  const del = async (id) => {
    try { await api.delete(`/ticket-types/${id}`); setPlans(p => p.filter(t => t.id !== id)); } catch {}
  };

  const toggleActive = async (plan) => {
    try {
      const { data } = await api.put(`/ticket-types/${plan.id}`, { is_active: !plan.is_active });
      setPlans(p => p.map(t => t.id === plan.id ? data : t));
    } catch {}
  };

  if (!eventId) return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
      Guarda el evento primero para agregar planes.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            Define los tipos de participación: Oyente (gratis), Concursante (pago), Asistente, etc.
          </p>
          <p className="mt-0.5 text-xs text-gray-400">Los usuarios verán estas opciones al inscribirse al festival.</p>
        </div>
        {!showAdd && (
          <button onClick={() => { setShowAdd(true); setEditing(null); }}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors">
            <Plus size={13}/> Nuevo plan
          </button>
        )}
      </div>

      {showAdd && <PlanForm onSave={create} onCancel={() => setShowAdd(false)} saving={saving}/>}

      {load ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-300"/></div>
      ) : plans.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
          <Ticket size={28} className="text-gray-200"/>
          <div>
            <p className="text-sm text-gray-400">Sin planes de participación</p>
            <p className="mt-0.5 text-xs text-gray-300">Sin planes, todos se inscriben con el precio general del evento</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors">
            <Plus size={13}/> Crear primer plan
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            editing?.id === plan.id ? (
              <PlanForm
                key={plan.id}
                initial={{ ...plan, price: plan.price_cents ? plan.price_cents / 100 : '', capacity: plan.capacity ?? '', sort_order: plan.sort_order ?? '0' }}
                onSave={update}
                onCancel={() => setEditing(null)}
                saving={saving}
              />
            ) : (
              <div key={plan.id} className={`group rounded-2xl border bg-white p-4 shadow-sm transition-colors ${plan.is_active ? 'border-gray-200 hover:border-violet-200' : 'border-dashed border-gray-200 opacity-60'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${plan.price_cents === 0 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      {plan.price_cents === 0 ? <Ticket size={16} className="text-emerald-600"/> : <CreditCard size={16} className="text-amber-600"/>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{plan.name}</span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${plan.price_cents === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                          {plan.price_cents === 0 ? 'Gratuito' : fmtMXN(plan.price_cents)}
                        </span>
                        {!plan.is_active && <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-400">Inactivo</span>}
                      </div>
                      {plan.description && <p className="mt-0.5 text-xs text-gray-500 truncate">{plan.description}</p>}
                      {plan.capacity && <p className="mt-0.5 text-[10px] text-gray-400">{plan.capacity} cupos máx.</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(plan)}
                      className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-colors" title={plan.is_active ? 'Desactivar' : 'Activar'}>
                      {plan.is_active ? <ToggleRight size={16} className="text-emerald-500"/> : <ToggleLeft size={16}/>}
                    </button>
                    <button onClick={() => setEditing(plan)} className="rounded-lg p-1.5 text-gray-300 hover:bg-violet-50 hover:text-violet-600 transition-colors"><Edit3 size={14}/></button>
                    <button onClick={() => del(plan.id)} className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {plans.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-600">
          <strong>Tip:</strong> Si tienes planes configurados, los usuarios verán una pantalla de selección antes de inscribirse. Si no hay planes, se usan directamente el precio y formulario del evento.
        </div>
      )}
    </div>
  );
};

// ── Editor de evento (con tabs) ───────────────────────────────────────────────
const EventEditor = ({ event: init, onBack, onCreate }) => {
  const [event,   setEvent]  = useState(init);
  const [form,    setForm]   = useState(init ? { ...EMPTY_EV, ...init, price: init.price_cents ? init.price_cents/100 : '' } : EMPTY_EV);
  const [regs,    setRegs]   = useState([]);
  const [saving,  setSaving] = useState(false);
  const [editing, setEdit]   = useState(!init);
  const [copied,  setCopied] = useState(false);
  const [msg,     setMsg]    = useState('');
  const [delConf, setDel]    = useState(false);
  const [tab,     setTab]    = useState('detalles');

  useEffect(() => {
    if (!event?.id) return;
    api.get(`/my-event/${event.id}/registrations`).then(r => setRegs(r.data ?? [])).catch(() => {});
  }, [event?.id]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const save = async () => {
    setSaving(true);
    try {
      const { price, ...rest } = form;
      const payload = { ...rest, price_cents: Math.round(parseFloat(price||0)*100) };
      if (!payload.slug && payload.title) payload.slug = toSlug(payload.title);
      const { data } = event?.id
        ? await api.put(`/my-event/${event.id}`, payload)
        : await api.post('/my-event', payload);
      setEvent(data);
      setForm({ ...EMPTY_EV, ...data, price: data.price_cents ? data.price_cents/100 : '' });
      setEdit(false);
      flash('ok');
      if (!init) onCreate(data);
    } catch (err) { flash(err.response?.data?.error ?? 'Error al guardar.'); }
    finally { setSaving(false); }
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
    onBack(event.id);
  };

  const TABS = [
    { key:'detalles',   label:'Detalles',     count: null },
    { key:'vista',      label:'Vista previa', count: null },
    { key:'inscritos',  label:'Inscritos',    count: regs.length },
    { key:'planes',     label:'Planes',    count: null },
    { key:'concursos',  label:'Concursos', count: null },
    { key:'noticias',   label:'Noticias',  count: null },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={13}/> Mis eventos
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
            <button onClick={copyLink}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
              {copied ? <><CheckCheck size={12} className="text-emerald-600"/>Copiado</> : <><Copy size={12}/>Copiar link</>}
            </button>
            <button onClick={() => setTab('vista')}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
              <Eye size={12}/> Ver página
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {event?.id && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 [scrollbar-width:none]">
          {TABS.map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===key ? 'border-violet-500 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
              {count !== null && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab===key ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab: Detalles ── */}
      {(tab === 'detalles' || !event?.id) && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900">{event ? 'Información del festival' : 'Crear evento'}</h3>
            {event && !editing && (
              <button onClick={() => setEdit(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                <Edit3 size={11}/> Editar
              </button>
            )}
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {[['title','Nombre del evento *','Festival de Verano 2026'],['date','Fecha(s)','12–14 Mar 2026'],['location','Lugar','Auditorio Principal'],['slug','URL pública','festival-verano-2026']].map(([k,l,ph]) => (
              <div key={k}>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{l}</label>
                <input value={form[k]??''} placeholder={ph} disabled={!editing&&!!event}
                  onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className={inputCls}/>
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Descripción</label>
              <textarea value={form.summary??''} rows={3} disabled={!editing&&!!event}
                placeholder="Cuéntales a los asistentes de qué trata…"
                onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
                className={`${inputCls} resize-none`}/>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Precio MXN (0 = gratuito)</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-gray-400">$</span>
                <input type="number" min="0" value={form.price??''} placeholder="0" disabled={!editing&&!!event}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={`${inputCls} pl-7`}/>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500">Color de portada</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} type="button" disabled={!editing&&!!event}
                    onClick={() => setForm(p => ({ ...p, cover_color: c }))}
                    className={`h-8 w-8 rounded-full ${COLOR_DOTS[c]} transition-all disabled:cursor-default ${form.cover_color===c ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : 'opacity-40 hover:opacity-70'}`}/>
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
                <button onClick={() => { setEdit(false); setForm({ ...EMPTY_EV, ...event, price: event.price_cents ? event.price_cents/100 : '' }); }}
                  className="rounded-xl border border-gray-200 px-5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
              )}
            </div>
          )}
          {msg && (
            <div className={`mx-6 mb-4 rounded-xl px-4 py-2.5 text-xs ${msg==='ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {msg==='ok' ? '✓ Guardado correctamente.' : msg}
            </div>
          )}

          {/* Zona peligrosa */}
          {event?.id && (
            <div className="mx-6 mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <h4 className="text-sm font-semibold text-red-700">Zona de peligro</h4>
              <p className="mt-0.5 text-xs text-red-500">Eliminar el evento borra todos sus datos permanentemente.</p>
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
      )}

      {/* ── Tab: Vista previa ── */}
      {tab === 'vista' && event?.id && <VistaTab event={event} onGo={setTab}/>}

      {/* ── Tab: Inscritos ── */}
      {tab === 'inscritos' && event?.id && <InscritosTab event={event} regs={regs}/>}

      {/* ── Tab: Planes ── */}
      {tab === 'planes' && event?.id && <PlanesTab eventId={event.id}/>}

      {/* ── Tab: Concursos ── */}
      {tab === 'concursos' && event?.id && <ConcursosTab eventId={event.id}/>}

      {/* ── Tab: Noticias ── */}
      {tab === 'noticias' && event?.id && <NoticiasTab eventSlug={event.slug}/>}

    </div>
  );
};

// ── Lista de eventos (vista principal) ────────────────────────────────────────
const MyEventPanel = () => {
  const [events,  setEvents] = useState([]);
  const [loading, setLoad]   = useState(true);
  const [active,  setActive] = useState(null);

  useEffect(() => {
    api.get('/my-event').then(r => {
      const list = Array.isArray(r.data) ? r.data : (r.data ? [r.data] : []);
      setEvents(list);
    }).catch(() => {}).finally(() => setLoad(false));
  }, []);

  const handleCreate = (ev) => { setEvents(p => [ev, ...p]); setActive(ev); };
  const handleDelete = (id) => { setEvents(p => p.filter(e => e.id !== id)); setActive(null); };

  if (loading) return (
    <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100"/>)}</div>
  );

  if (active) return (
    <EventEditor
      event={active === 'new' ? null : active}
      onBack={(deletedId) => { if (deletedId) handleDelete(deletedId); else setActive(null); }}
      onCreate={handleCreate}
    />
  );

  const COLOR_BG = { violet:'bg-violet-100', emerald:'bg-emerald-100', amber:'bg-amber-100', rose:'bg-rose-100', indigo:'bg-indigo-100' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mis Eventos</h2>
          <p className="mt-0.5 text-sm text-gray-500">Festivales, cursos y concursos — todo en un lugar.</p>
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
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${COLOR_BG[ev.cover_color] ?? 'bg-gray-100'}`}>
                  {ev.is_published ? <Globe size={18} className="text-emerald-600"/> : <Lock size={18} className="text-gray-400"/>}
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ev.is_published ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                  {ev.is_published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <div className="min-w-0 w-full">
                <div className="truncate font-semibold text-gray-900">{ev.title}</div>
                <div className="mt-0.5 text-xs text-gray-400">{ev.date||'Sin fecha'}{ev.location ? ` · ${ev.location}` : ''}</div>
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
