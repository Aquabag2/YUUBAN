import { GraduationCap, Briefcase, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* Selector para que un admin entre a la app real como alumno o como administrador */
const OPTIONS = [
  { key: 'student',     label: 'Alumno', title: 'alumno',        icon: GraduationCap },
  { key: 'admin',       label: 'Admin',  title: 'administrador', icon: Briefcase },
  { key: 'super_admin', label: 'Super',  title: 'super admin',   icon: Crown },
];

const RoleSwitch = ({ compact = false, vertical = false, className = '' }) => {
  const { canSwitch, viewModes, viewAs, setViewAs } = useAuth();
  if (!canSwitch) return null;

  return (
    <div role="radiogroup" aria-label="Entrar como"
      className={`inline-flex rounded-full border border-yb-rule bg-white p-0.5 font-yb-sans shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${vertical ? 'flex-col' : ''} ${className}`}>
      {OPTIONS.filter((o) => viewModes.includes(o.key)).map(({ key, label, title, icon: Icon }) => {
        const active = viewAs === key;
        return (
          <button key={key} type="button" role="radio" aria-checked={active}
            onClick={() => !active && setViewAs(key)}
            title={`Entrar como ${title}`}
            className={`flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${compact ? 'h-8 w-8' : 'px-3 py-1.5'} ${active ? 'bg-yb-ink text-yb-paper' : 'text-yb-ink-muted hover:text-yb-ink'}`}>
            <Icon size={14} strokeWidth={active ? 2 : 1.7} className="shrink-0" />
            {!compact && label}
          </button>
        );
      })}
    </div>
  );
};

export default RoleSwitch;
