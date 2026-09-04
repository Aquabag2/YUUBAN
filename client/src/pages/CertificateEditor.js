import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Save, Plus, Trash2, Eye, Download, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import api from '../lib/api';

const FIELD_KEYS = [
  { key: 'name',  label: 'Nombre del participante' },
  { key: 'event', label: 'Nombre del evento' },
  { key: 'date',  label: 'Fecha del evento' },
];

const DEFAULT_FIELDS = [
  { key: 'name',  label: 'Nombre',  x: 0.5, y: 0.50, fontSize: 36, color: '#1a1a1a', align: 'center', fontWeight: 'bold' },
  { key: 'event', label: 'Evento',  x: 0.5, y: 0.62, fontSize: 22, color: '#4B5563', align: 'center', fontWeight: 'normal' },
  { key: 'date',  label: 'Fecha',   x: 0.5, y: 0.72, fontSize: 18, color: '#6B7280', align: 'center', fontWeight: 'normal' },
];

const PREVIEW_DATA = {
  name:  'María González',
  event: 'Festival Yuuban 2025',
  date:  '15 de agosto de 2025',
};

export default function CertificateEditor({ eventId, onSaved, isPlatform = false }) {
  const [templates, setTemplates]   = useState([]);
  const [selected, setSelected]     = useState(null);   // template activo
  const [fields, setFields]         = useState(DEFAULT_FIELDS);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [dragging, setDragging]     = useState(null);   // índice del campo arrastrado
  const [status, setStatus]         = useState('');
  const [error, setError]           = useState('');
  const [templateName, setTemplateName] = useState('');
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => { if (selected) drawCanvas(); }, [selected, fields]);

  const loadTemplates = async () => {
    try {
      const { data } = await api.get('/certificates/templates');
      setTemplates(data || []);
    } catch { /* sin templates */ }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);

      fields.forEach((f, i) => {
        const x = f.x * W;
        const y = f.y * H;
        const text = PREVIEW_DATA[f.key] || f.label;
        const scale = W / 842; // A4 landscape scale
        const fs = Math.round((f.fontSize || 24) * scale);

        ctx.font = `${f.fontWeight === 'bold' ? 'bold' : 'normal'} ${fs}px sans-serif`;
        ctx.fillStyle = f.color || '#000';
        ctx.textAlign = f.align || 'center';
        ctx.fillText(text, x, y);

        // Indicador de selección
        const metrics = ctx.measureText(text);
        const tw = metrics.width;
        const tx = f.align === 'center' ? x - tw / 2 : x;
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(tx - 6, y - fs - 4, tw + 12, fs + 10);
        ctx.setLineDash([]);

        // Número de campo
        ctx.fillStyle = '#7C3AED';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(i + 1, tx - 5, y - fs - 6);
      });
    };
    img.src = selected.image_url;
  }, [selected, fields]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!templateName.trim()) return setError('Escribe un nombre para el template primero.');
    setUploading(true); setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('name', templateName.trim());
      form.append('fields', JSON.stringify(DEFAULT_FIELDS));
      form.append('is_platform', isPlatform ? 'true' : 'false');
      const { data } = await api.post('/certificates/templates', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTemplates(prev => [data, ...prev]);
      setSelected(data);
      setFields(data.fields || DEFAULT_FIELDS);
      setStatus('Template subido.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir imagen.');
    }
    setUploading(false);
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    const idx = fields.findIndex(f => Math.abs(f.x - mx) < 0.12 && Math.abs(f.y - my) < 0.06);
    if (idx !== -1) setDragging(idx);
  };

  const handleMouseMove = (e) => {
    if (dragging === null) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const my = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setFields(prev => prev.map((f, i) => i === dragging ? { ...f, x: mx, y: my } : f));
  };

  const handleMouseUp = () => setDragging(null);

  const saveFields = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      await api.put(`/certificates/templates/${selected.id}/fields`, { fields });
      if (eventId) await api.post(`/certificates/event/${eventId}/assign`, { template_id: selected.id });
      setStatus('Guardado correctamente.');
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Editor de constancias</h2>
        <p className="text-sm text-gray-500">Sube tu diseño de Canva o elige un template de Yuuban. Arrastra los campos para posicionarlos.</p>
      </div>

      {/* Feedback */}
      {status && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle size={15} /> {status}
          <button onClick={() => setStatus('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Panel izquierdo */}
        <div className="space-y-4">
          {/* Subir template */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-700">Subir tu diseño</h3>
            <input
              type="text"
              placeholder="Nombre del template"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 py-3 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 transition-colors"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Subiendo...' : 'PNG, JPG o PDF (máx 10MB)'}
            </button>
            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={handleUpload} />
          </div>

          {/* Templates disponibles */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-700">Templates disponibles</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {templates.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Sin templates aún</p>
              )}
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelected(t); setFields(t.fields || DEFAULT_FIELDS); }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected?.id === t.id
                      ? 'bg-violet-100 border border-violet-300 text-violet-800'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium truncate">{t.name}</div>
                  {t.is_platform && <div className="text-xs text-violet-500">Template Yuuban</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Configuración de campos */}
          {selected && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-700">Campos</h3>
              <div className="space-y-3">
                {fields.map((f, i) => (
                  <div key={f.key} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">{i + 1}</span>
                      <span className="text-xs font-medium text-gray-700">{FIELD_KEYS.find(k => k.key === f.key)?.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500">Tamaño</label>
                        <input type="number" min={10} max={80} value={f.fontSize}
                          onChange={e => setFields(prev => prev.map((ff, ii) => ii === i ? { ...ff, fontSize: +e.target.value } : ff))}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Color</label>
                        <input type="color" value={f.color}
                          onChange={e => setFields(prev => prev.map((ff, ii) => ii === i ? { ...ff, color: e.target.value } : ff))}
                          className="w-full h-7 rounded border border-gray-200 cursor-pointer" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-[10px] text-gray-500">Peso</label>
                      <select value={f.fontWeight}
                        onChange={e => setFields(prev => prev.map((ff, ii) => ii === i ? { ...ff, fontWeight: e.target.value } : ff))}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs">
                        <option value="normal">Normal</option>
                        <option value="bold">Negrita</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas editor */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="flex h-80 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center">
                <Eye size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Selecciona o sube un template para editar</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Arrastra los campos numerados para reposicionarlos.</p>
              <canvas
                ref={canvasRef}
                width={842}
                height={595}
                className="w-full rounded-xl border border-gray-200 shadow-sm cursor-crosshair"
                style={{ maxHeight: '420px', objectFit: 'contain' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              <button
                onClick={saveFields}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Guardando...' : eventId ? 'Guardar y asignar al evento' : 'Guardar template'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
