import { Map } from 'lucide-react';

const ADMIN_SECTIONS = [
  {
    group: 'Eventos y festivales',
    cards: [
      {
        url: '/mi-evento',
        name: 'Mi Evento',
        actions: [
          'Crear evento con título, fecha, lugar y color',
          'Definir URL pública (slug) → yuubanserver.vercel.app/e/slug',
          'Publicar o dejar en borrador',
          'Ver lista de inscritos y exportar CSV',
        ],
      },
    ],
  },
  {
    group: 'Alumnos y horarios',
    cards: [
      {
        url: '/admin',
        name: 'Panel Admin',
        actions: [
          'Agregar y gestionar alumnos',
          'Asignar horario personal a cada alumno',
          'Definir instrumento, sala y maestro',
          'Ver estadísticas generales',
        ],
      },
      {
        url: '/maestros',
        name: 'Maestros',
        actions: ['Registrar maestros', 'Asignarlos a horarios y grupos'],
      },
    ],
  },
  {
    group: 'Comunicación',
    cards: [
      {
        url: '/novedades',
        name: 'Novedades',
        actions: ['Publicar noticias y avisos', 'Los alumnos las ven en tiempo real'],
      },
    ],
  },
  {
    group: 'Concursos',
    cards: [
      {
        url: '/admin → Concursos',
        name: 'Gestión de concursos',
        actions: [
          'Crear concurso con categoría y fechas',
          'Inscribir alumnos al concurso',
          'Actualizar fase: audición, evaluación, resultados',
          'Registrar lugar obtenido y puntaje',
        ],
      },
    ],
  },
  {
    group: 'Solo Super Admin',
    cards: [
      {
        url: '/super',
        name: 'Plataforma',
        actions: ['Cambiar roles de usuarios', 'Ver métricas globales', 'Gestionar clientes'],
      },
    ],
  },
];

const STUDENT_SECTIONS = [
  {
    group: 'Sin login — cualquier persona',
    isPublic: true,
    cards: [
      {
        url: '/e/:slug',
        name: 'Página pública del festival',
        actions: [
          'Ver info del evento (título, fecha, lugar)',
          'Ver el programa / agenda',
          'Formulario de inscripción pública',
          'Pago con Stripe si tiene precio',
        ],
      },
    ],
  },
  {
    group: 'Con login — rol Estudiante',
    cards: [
      {
        url: '/dashboard',
        name: 'Dashboard',
        actions: ['Resumen general de su cuenta'],
      },
      {
        url: '/estudiante',
        name: 'Mis Clases',
        actions: [
          'Ver su horario personal asignado',
          'Ver sala, maestro y hora de cada clase',
          'Descargar horario .ics',
        ],
      },
      {
        url: '/cursos',
        name: 'Cursos',
        actions: ['Ver festivales y cursos disponibles', 'Inscribirse a un evento'],
      },
    ],
  },
  {
    group: 'Noticias',
    cards: [
      {
        url: '/novedades',
        name: 'Novedades',
        actions: ['Leer avisos publicados por el admin', 'Actualizaciones en tiempo real'],
      },
    ],
  },
  {
    group: 'Concursos',
    cards: [
      {
        url: '/mis-concursos',
        name: 'Mis Concursos',
        actions: [
          'Ver concursos en los que está inscrito',
          'Ver fase actual (timeline)',
          'Ver resultados y lugar obtenido',
          'Descargar diploma si aplicó',
          'Ver concursos disponibles para inscribirse',
        ],
      },
    ],
  },
  {
    group: 'Constancias',
    cards: [
      {
        url: '/estudiante → Constancias',
        name: 'Mis Constancias',
        actions: [
          'Descargar constancia de cursos completados',
          'Ver estado de cada constancia',
        ],
      },
    ],
  },
];

const DB_TABLES = [
  'events', 'registrations', 'students', 'student_schedules',
  'teachers', 'contests', 'contest_enrollments', 'news',
  'user_profiles', 'certificates',
];

// ── Tarjeta de sección ────────────────────────────────────────────────────────
function SectionCard({ card, role }) {
  const isPublic = role === 'public';
  const urlColor = isPublic
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : role === 'admin'
    ? 'bg-violet-50 text-violet-700 border-violet-200'
    : 'bg-teal-50 text-teal-700 border-teal-200';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide mb-2 ${urlColor}`}>
        {card.url}
      </span>
      <div className="font-semibold text-gray-900 text-sm mb-2.5">{card.name}</div>
      <ul className="space-y-1.5">
        {card.actions.map((a, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
            <span className="mt-0.5 shrink-0 text-gray-300">→</span>
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Columna de rol ─────────────────────────────────────────────────────────────
function RoleColumn({ title, subtitle, emoji, sections, accent, badge }) {
  return (
    <div className="flex flex-col">
      <div className={`flex items-center gap-3 pb-4 mb-4 border-b-2 ${accent.border}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${accent.icon}`}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${accent.text}`}>{title}</div>
          <div className="text-xs text-gray-400">{subtitle}</div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${accent.badge}`}>{badge}</span>
      </div>

      <div className="flex flex-col gap-5">
        {sections.map((section) => (
          <div key={section.group}>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              {section.group}
            </div>
            <div className="flex flex-col gap-2.5">
              {section.cards.map((card) => (
                <SectionCard
                  key={card.url}
                  card={card}
                  role={section.isPublic ? 'public' : title === 'Administrador' ? 'admin' : 'student'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
const Mapa = () => (
  <div className="space-y-8">

    {/* Header */}
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
          <Map size={16} className="text-violet-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Mapa del sistema</h1>
      </div>
      <p className="text-sm text-gray-500 ml-10">
        Todo lo que puedes gestionar como admin y lo que ve cada estudiante.
      </p>
    </div>

    {/* Legend */}
    <div className="flex flex-wrap gap-4 text-xs font-semibold">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-violet-500 block" />
        <span className="text-gray-500">Admin / Super Admin</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-teal-500 block" />
        <span className="text-gray-500">Estudiante (con login)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block" />
        <span className="text-gray-500">Página pública (sin login)</span>
      </div>
    </div>

    {/* Two-column diagram */}
    <div className="grid gap-6 lg:grid-cols-2">
      <RoleColumn
        title="Administrador"
        subtitle="Gestiona todo el contenido"
        emoji="🛠"
        sections={ADMIN_SECTIONS}
        badge="Admin"
        accent={{
          border: 'border-violet-200',
          icon:   'bg-violet-600 text-white',
          text:   'text-violet-700',
          badge:  'bg-violet-100 text-violet-700',
        }}
      />
      <RoleColumn
        title="Estudiante"
        subtitle="Ve su información personal"
        emoji="🎓"
        sections={STUDENT_SECTIONS}
        badge="Student"
        accent={{
          border: 'border-teal-200',
          icon:   'bg-teal-600 text-white',
          text:   'text-teal-700',
          badge:  'bg-teal-100 text-teal-700',
        }}
      />
    </div>

    {/* Supabase band */}
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">🗄️</span>
            <span className="font-bold text-gray-900 text-sm">Supabase — base de datos central</span>
          </div>
          <p className="text-xs text-gray-500 ml-7">
            Toda la información fluye aquí. El admin escribe, el estudiante lee solo lo suyo (RLS).
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {DB_TABLES.map((t) => (
            <span key={t} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* Flow summary */}
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Flujo de información</div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {[
          { icon: '🛠', label: 'Admin crea contenido', color: 'bg-violet-50 text-violet-700 border-violet-200' },
          { icon: '→', label: '', color: '' },
          { icon: '🗄️', label: 'Supabase lo guarda', color: 'bg-gray-50 text-gray-600 border-gray-200' },
          { icon: '→', label: '', color: '' },
          { icon: '🎓', label: 'Estudiante lo ve', color: 'bg-teal-50 text-teal-700 border-teal-200' },
        ].map((step, i) =>
          step.label ? (
            <span key={i} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${step.color}`}>
              {step.icon} {step.label}
            </span>
          ) : (
            <span key={i} className="text-gray-300 font-bold text-base">{step.icon}</span>
          )
        )}
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Nunca al revés: el estudiante solo lee lo que le corresponde. El admin tiene acceso completo.
      </p>
    </div>

  </div>
);

export default Mapa;
