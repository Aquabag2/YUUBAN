import { useEffect, useState } from 'react';
import {
  Globe, Edit3, ExternalLink, Copy, CheckCheck,
  ToggleLeft, ToggleRight, Download, Search,
  Users, DollarSign, TrendingUp,
} from 'lucide-react';
import api from '../lib/api';

const COLORS = ['violet', 'emerald', 'amber', 'rose', 'indigo'];
const COLOR_DOTS = {
  violet:  'bg-violet-500', emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',  rose:    'bg-rose-500', indigo: 'bg-indigo-500',
};
const EMPTY = {
  title: '', location: '', date: '', summary: '',
  slug: '', cover_color: 'violet', is_published: false, price: '',
};
const toSlug = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 60);

const fmtMXN = (cents) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(cents / 100);

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-gray-50 disabled:text-gray-500 transition-all';

const MyEventPanel = () => {
  const [event, setEvent]         = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [registrations, setRegs]  = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editing, setEditing]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('todos');

  useEffect(() => {
    api.get('/my-event')
      .then(({ data }) => {
        setEvent(data);
        if (data) {
          setForm({ ...EMPTY, ...data, price: data.price_cents ? data.price_cents / 100 : '' });
          return api.get(`/my-event/${data.id}/registrations`).catch(() => ({ data: [] }));
        }
      })
      .then((res) => res && setRegs(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const { price, ...rest } = form;
      const payload = { ...rest, price_cents: Math.round(parseFloat(price || 0) * 100) };
      if (!payload.slug && payload.title) payload.slug = toSlug(payload.title);
      const { data } = event?.id
        ? await api.put(`/my-event/${event.id}`, payload)
        : await api.post('/my-event', payload);
      setEvent(data);
      setForm({ ...EMPTY, ...data, price: data.price_cents ? data.price_cents / 100 : '' });
      setEditing(false); setSaveMsg('ok');
      if (data?.id) {
        const { data: regs } = await api.get(`/my-event/${data.id}/registrations`).catch(() => ({ data: [] }));
        setRegs(regs ?? []);
      }
    } catch (err) {
      setSaveMsg(err.response?.data?.error ?? 'Error al guardar.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const togglePublish = async () => {
    if (!event?.id) return;
    const next = !event.is_published;
    const { data } = await api.put(`/my-event/${event.id}`, { is_published: next });
    setEvent(data); setForm((p) => ({ ...p, is_published: next }));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/e/${event?.slug}`).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const exportExcel = () => {
    const priceCents = event?.price_cents ?? 0;
    const headers = ['Nombre', 'Correo', 'Instrumento', 'Notas', 'Estado de pago', 'Monto (MXN)', 'Fecha'];
    const rows = registrations.map((r) => [
      r.name, r.email, r.instrument ?? '', r.notes ?? '',
      priceCents > 0 ? (r.paid ? 'Pagado' : 'Pendiente') : 'Gratuito',
      priceCents > 0 ? (r.paid ? (priceCents / 100).toFixed(2) : '0.00') : '0.00',
      new Date(r.created_at).toLocaleDateString('es-MX'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inscritos-${event?.slug ?? 'evento'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const priceCents = event?.price_cents ?? 0;
  const filtered = registrations.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.instrument ?? '').toLowerCase().includes(q);
    const matchFilter =
      filterStatus === 'todos'     ? true
      : filterStatus === 'pagado'    ? r.paid === true
      : filterStatus === 'pendiente' ? (priceCents > 0 && !r.paid)
      : filterStatus === 'gratuito'  ? priceCents === 0
      : true;
    return matchSearch && matchFilter;
  });

  const totalRevenue = registrations.filter((r) => r.paid).length * priceCents;
  const paidCount    = registrations.filter((r) => r.paid).length;
  const pendingCount = priceCents > 0 ? registrations.filter((r) => !r.paid).length : 0;

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />)}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Globe size={18} className="text-violet-500" /> Mi página de evento
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            La página pública donde la gente ve el programa y se inscribe.
          </p>
        </div>

        {event?.slug && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={togglePublish}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                event.is_published
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}>
              {event.is_published ? <><ToggleRight size={13} /> Publicado</> : <><ToggleLeft size={13} /> Borrador</>}
            </button>
            <button type="button" onClick={copyLink}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
              {copied ? <><CheckCheck size={12} className="text-emerald-600" /> Copiado</> : <><Copy size={12} /> Copiar link</>}
            </button>
            <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
              <ExternalLink size={12} /> Ver página
            </a>
          </div>
        )}
      </div>

      {/* ── Stats rápidas ── */}
      {event?.id && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Users,      label: 'Inscritos',  value: registrations.length,                               color: 'text-violet-600' },
            { icon: DollarSign, label: 'Recaudado',  value: priceCents > 0 ? fmtMXN(totalRevenue) : '—',        color: 'text-emerald-600' },
            { icon: CheckCheck, label: 'Pagados',    value: paidCount,                                           color: 'text-emerald-600' },
            { icon: TrendingUp, label: 'Pendientes', value: pendingCount,                                        color: 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-xs text-gray-500">{label}</div>
              <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Editor del evento ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {event ? 'Información del evento' : 'Crear tu evento'}
          </h3>
          {event && !editing && (
            <button type="button" onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              <Edit3 size={11} /> Editar
            </button>
          )}
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {[
            ['title',    'Nombre del evento *', 'Festival de Primavera 2026'],
            ['date',     'Fecha(s)',             '12–14 Marzo 2026'],
            ['location', 'Lugar',                'Auditorio Principal'],
            ['slug',     'URL pública',          'festival-primavera-2026'],
          ].map(([key, label, ph]) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
              <input value={form[key] ?? ''} placeholder={ph} disabled={!editing && !!event}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className={inputCls} />
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Descripción</label>
            <textarea value={form.summary ?? ''} rows={3} disabled={!editing && !!event}
              placeholder="Cuéntales a los asistentes de qué trata el evento…"
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </div>

          {/* Precio */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Precio (MXN) — 0 = gratuito
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-gray-400">$</span>
              <input type="number" min="0" step="1" value={form.price ?? ''} placeholder="0"
                disabled={!editing && !!event}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className={`${inputCls} pl-7`} />
            </div>
            {(parseFloat(form.price) || 0) > 0 && (
              <p className="mt-1 text-xs text-amber-600">Se activará el pago con Stripe al inscribirse.</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-500">Color de portada</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" disabled={!editing && !!event}
                  onClick={() => setForm((p) => ({ ...p, cover_color: c }))}
                  className={`h-8 w-8 rounded-full ${COLOR_DOTS[c]} transition-all disabled:cursor-default ${
                    form.cover_color === c ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : 'opacity-40 hover:opacity-70'
                  }`} />
              ))}
            </div>
          </div>
        </div>

        {(editing || !event) && (
          <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={save} disabled={saving}
              className="flex-1 rounded-xl bg-[#7C3AED] py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors shadow-sm shadow-violet-200">
              {saving ? 'Guardando…' : event ? 'Guardar cambios' : 'Crear evento'}
            </button>
            {editing && (
              <button type="button"
                onClick={() => { setEditing(false); setForm({ ...EMPTY, ...event, price: event.price_cents ? event.price_cents / 100 : '' }); }}
                className="rounded-xl border border-gray-200 px-5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            )}
          </div>
        )}

        {saveMsg && (
          <div className={`mx-6 mb-4 rounded-xl px-4 py-2.5 text-xs ${saveMsg === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {saveMsg === 'ok' ? '✓ Guardado correctamente.' : saveMsg}
          </div>
        )}
      </div>

      {/* ── Tabla de inscritos ── */}
      {event?.id && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              Inscritos
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                {registrations.length}
              </span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar…"
                  className="w-44 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all" />
              </div>

              <select value={filterStatus} onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-xs text-gray-600 outline-none focus:border-violet-400 transition-all">
                <option value="todos">Todos los estados</option>
                {priceCents > 0 && <option value="pagado">Pagado</option>}
                {priceCents > 0 && <option value="pendiente">Pendiente</option>}
                {priceCents === 0 && <option value="gratuito">Gratuito</option>}
              </select>

              {registrations.length > 0 && (
                <button type="button" onClick={exportExcel}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
                  <Download size={12} /> Exportar Excel
                </button>
              )}
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Users size={28} className="text-gray-200" />
              <div className="text-sm text-gray-400">Aún no hay inscritos.</div>
              <div className="text-xs text-gray-300">Comparte el link de tu evento para recibir registros.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Sin resultados para "{search}".</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Nombre</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Correo</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 hidden md:table-cell">Instrumento</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400">Estado</th>
                    {priceCents > 0 && <th className="px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Monto</th>}
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 hidden lg:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const isPaidEvent = priceCents > 0;
                    return (
                      <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                        <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{r.name}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{r.email}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-500 hidden md:table-cell">{r.instrument || '—'}</td>
                        <td className="px-4 py-3.5">
                          {isPaidEvent ? (
                            r.paid
                              ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">✓ Pagado</span>
                              : <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">Pendiente</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">Gratuito</span>
                          )}
                        </td>
                        {isPaidEvent && (
                          <td className="px-4 py-3.5 text-sm font-medium text-gray-700 hidden sm:table-cell">
                            {r.paid ? fmtMXN(priceCents) : '—'}
                          </td>
                        )}
                        <td className="px-6 py-3.5 text-xs text-gray-400 hidden lg:table-cell">
                          {new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyEventPanel;
