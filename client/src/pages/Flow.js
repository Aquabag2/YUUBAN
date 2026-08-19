import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { useWorkflow } from '../context/WorkflowContext';

const TYPE_COLORS = {
  Clase:      'border-violet-500/40 bg-violet-500/10',
  Logística:  'border-amber-500/40  bg-amber-500/10',
  Ensayo:     'border-emerald-500/40 bg-emerald-500/10',
  Transporte: 'border-indigo-500/40  bg-indigo-500/10',
};

const TYPE_DOT = {
  Clase:      'bg-violet-500',
  Logística:  'bg-amber-500',
  Ensayo:     'bg-emerald-500',
  Transporte: 'bg-indigo-500',
};

const Flow = () => {
  const { ordered, update, shift } = useWorkflow();
  const [selectedId, setSelectedId] = useState(null);
  const selected = ordered.find((it) => it.id === selectedId) ?? ordered[0];

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <GitBranch size={20} className="text-violet-400" /> Flujo visual del día
      </h2>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">

        {/* ── Canvas ── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Lienzo dinámico</h3>
              <p className="text-sm text-white/40">Selecciona un bloque para editarlo.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/30">
              {Object.entries(TYPE_DOT).map(([type, cls]) => (
                <span key={type} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${cls}`} /> {type}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div
              className="relative min-w-[900px] rounded-2xl border border-white/10 px-8 py-14"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* SVG connectors */}
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                {ordered.map((item, index) => {
                  if (index === ordered.length - 1) return null;
                  const sx = 120 + index * 210;
                  const ex = 120 + (index + 1) * 210;
                  const sy = index % 2 === 0 ? 130 : 250;
                  const ey = (index + 1) % 2 === 0 ? 130 : 250;
                  return (
                    <g key={`conn-${item.id}`}>
                      <path
                        d={`M ${sx} ${sy} C ${sx + 55} ${sy} ${ex - 55} ${ey} ${ex} ${ey}`}
                        fill="none"
                        stroke="rgba(139,92,246,0.3)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <circle cx={ex} cy={ey} r="3" fill="rgba(139,92,246,0.7)" />
                    </g>
                  );
                })}
              </svg>

              {/* Nodes */}
              <div className="relative flex gap-6">
                {ordered.map((item, index) => {
                  const isTop = index % 2 === 0;
                  const isSelected = item.id === (selectedId ?? ordered[0]?.id);
                  const colorClass = TYPE_COLORS[item.type] ?? 'border-white/20 bg-white/5';
                  const dotClass = TYPE_DOT[item.type] ?? 'bg-white/40';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`relative w-48 shrink-0 text-left ${isTop ? 'mb-28' : 'mt-28'}`}
                    >
                      <div
                        className={`rounded-2xl border p-4 transition-all duration-200 ${colorClass} ${
                          isSelected
                            ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent scale-[1.03]'
                            : 'hover:scale-[1.02]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                          <span className="text-xs font-medium text-white/50">{item.type}</span>
                        </div>
                        <div className="mt-2 text-xl font-bold text-white">{item.time}</div>
                        <div className="mt-1 text-sm font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-xs text-white/50">{item.people}</div>
                        <div className="mt-0.5 text-xs text-white/30">{item.location}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel lateral ── */}
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-900/20 to-slate-900/20 p-6">
          <h3 className="text-base font-semibold text-white">Editar bloque</h3>
          <p className="mt-1 text-sm text-white/40">Cambios rápidos en tiempo real.</p>

          {selected ? (
            <div className="mt-5 space-y-3">
              {[
                ['time',     'Hora (HH:MM)'],
                ['title',    'Actividad'],
                ['type',     'Tipo'],
                ['people',   'Asistentes'],
                ['location', 'Lugar'],
              ].map(([key, placeholder]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-white/40 capitalize">{placeholder}</label>
                  <input
                    value={selected[key] ?? ''}
                    onChange={(e) => update(selected.id, { [key]: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                    placeholder={placeholder}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => shift(selected.id, -30)}
                  className="rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  − 30 min
                </button>
                <button
                  type="button"
                  onClick={() => shift(selected.id, 30)}
                  className="rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  + 30 min
                </button>
              </div>

              {/* Preview */}
              <div className={`mt-2 rounded-xl border p-4 ${TYPE_COLORS[selected.type] ?? 'border-white/10 bg-white/5'}`}>
                <div className="text-xs text-white/40">Vista previa</div>
                <div className="mt-1 text-2xl font-bold text-white">{selected.time}</div>
                <div className="text-sm font-medium text-white">{selected.title}</div>
                <div className="text-xs text-white/50">{selected.location}</div>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-center text-sm text-white/30">
              Selecciona un bloque para empezar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flow;
