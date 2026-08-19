import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

const TYPE_BADGE = {
  Clase:      'bg-violet-500/20 text-violet-300',
  Logística:  'bg-amber-500/20  text-amber-300',
  Ensayo:     'bg-emerald-500/20 text-emerald-300',
  Transporte: 'bg-indigo-500/20  text-indigo-300',
};

const TYPES = ['Clase', 'Logística', 'Ensayo', 'Transporte'];

const WorkflowCard = ({ item, onUpdate, onShift, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...item });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!editing) setDraft({ ...item });
  }, [item, editing]);

  const field = (key, placeholder) => (
    <input
      value={draft[key] ?? ''}
      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 transition-all"
      placeholder={placeholder}
    />
  );

  if (editing) {
    return (
      <div className="space-y-2.5">
        {field('time',  'Hora (HH:MM)')}
        {field('title', 'Actividad')}

        <select
          value={draft.type ?? ''}
          onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/60 transition-all"
        >
          <option value="" disabled>Tipo de actividad</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {field('people',   'Maestros / alumnos')}
        {field('location', 'Lugar')}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => { onUpdate(item.id, draft); setEditing(false); }}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-xs font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => { setDraft({ ...item }); setEditing(false); }}
            className="flex-1 rounded-lg border border-white/10 py-2 text-xs font-semibold text-white/60 hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[item.type] ?? 'bg-white/10 text-white/50'}`}>
          {item.type}
        </span>
        <span className="text-xs text-white/30">{item.location}</span>
      </div>
      <div className="text-xl font-bold text-white">{item.time}</div>
      <div className="text-sm font-medium text-white">{item.title}</div>
      <div className="text-xs text-white/50">{item.people}</div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => onShift(item.id, -30)}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          − 30 min
        </button>
        <button
          type="button"
          onClick={() => onShift(item.id, 30)}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          + 30 min
        </button>
        <button
          type="button"
          onClick={() => { setDraft({ ...item }); setEditing(true); }}
          className="rounded-lg bg-violet-600/30 px-3 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-600/50 transition-colors"
        >
          Editar
        </button>

        {onDelete && (
          confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/30 transition-colors"
              >
                ¿Confirmar?
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/40 hover:bg-white/10 transition-colors"
              >
                No
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-white/10 p-1.5 text-white/30 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default WorkflowCard;
