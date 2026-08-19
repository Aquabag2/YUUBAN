

-- Limpieza previa (por si ya existían tablas con estructura diferente)
DROP TABLE IF EXISTS student_schedules CASCADE;
DROP TABLE IF EXISTS messages          CASCADE;
DROP TABLE IF EXISTS workflow_items    CASCADE;
DROP TABLE IF EXISTS schedule_items    CASCADE;
DROP TABLE IF EXISTS students          CASCADE;
DROP TABLE IF EXISTS teachers          CASCADE;
DROP TABLE IF EXISTS events            CASCADE;

-- Eventos (el festival en sí)
CREATE TABLE events (
  id            BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title         TEXT NOT NULL,
  location      TEXT,
  date          TEXT,
  summary       TEXT,
  schedule_date DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Agenda pública
CREATE TABLE schedule_items (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id   BIGINT REFERENCES events(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time   TIME,
  title      TEXT NOT NULL,
  place      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

-- Flujo de trabajo del día
CREATE TABLE workflow_items (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id   BIGINT REFERENCES events(id) ON DELETE CASCADE,
  time       TEXT NOT NULL,
  title      TEXT NOT NULL,
  type       TEXT,
  people     TEXT,
  location   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE workflow_items ENABLE ROW LEVEL SECURITY;

-- Maestros
CREATE TABLE teachers (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name       TEXT NOT NULL,
  role       TEXT,
  schedule   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Alumnos
CREATE TABLE students (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name       TEXT NOT NULL,
  instrument TEXT,
  status     TEXT DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Horario de clases individuales
CREATE TABLE student_schedules (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id   BIGINT REFERENCES events(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  time_slot  TEXT NOT NULL,
  room       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE student_schedules ENABLE ROW LEVEL SECURITY;

-- Mensajes / tickets
CREATE TABLE messages (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name       TEXT NOT NULL,
  note       TEXT,
  status     TEXT DEFAULT 'Abierto',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ─── Datos de ejemplo ─────────────────────────────────────────────────────────
INSERT INTO events (title, location, date, summary, schedule_date) VALUES
  ('Festival Yuuban 2026', 'Auditorio Principal', '12-14 Marzo, 2026',
   'Encuentro musical con conciertos, clases y actividades para toda la comunidad.',
   '2026-03-12');

INSERT INTO schedule_items (event_id, start_time, end_time, title, place) VALUES
  (1, '10:00', '10:30', 'Apertura y bienvenida', 'Hall'),
  (1, '11:30', '12:15', 'Clase magistral', 'Sala A'),
  (1, '16:00', '17:00', 'Concierto principal', 'Auditorio');

INSERT INTO workflow_items (event_id, time, title, type, people, location) VALUES
  (1, '14:00', 'Clase de violín',     'Clase',      'Maestra Laura · 3 alumnos', 'Sala 2'),
  (1, '15:30', 'Comida del equipo',   'Logística',  'Maestros invitados',        'Comedor'),
  (1, '17:00', 'Ensayo con orquesta', 'Ensayo',     'Orquesta juvenil',          'Auditorio'),
  (1, '18:30', 'Transporte a hotel',  'Transporte', 'Maestros extranjeros',      'Lobby');

INSERT INTO teachers (name, role, schedule) VALUES
  ('Ana Martínez', 'Teoría Musical', 'Lun 10:00'),
  ('José García',  'Guitarra',       'Mar 16:00'),
  ('Laura Ruiz',   'Piano',          'Jue 12:00');

INSERT INTO students (name, instrument, status) VALUES
  ('Camila Soto',  'Piano',    'Activo'),
  ('Diego Pérez',  'Guitarra', 'Activo'),
  ('Valeria Cruz', 'Violín',   'Pendiente');

INSERT INTO student_schedules (event_id, student_id, teacher_id, time_slot, room) VALUES
  (1, 1, 3, '10:00 - 10:30', 'Sala 1'),
  (1, 2, 2, '10:30 - 11:00', 'Sala 1'),
  (1, 3, 1, '11:00 - 11:30', 'Sala 2');

INSERT INTO messages (name, note, status) VALUES
  ('Dudas generales', '16 mensajes nuevos', 'Abierto'),
  ('Inscripciones',   '5 pendientes',       'En proceso'),
  ('Pagos',           '2 pendientes',       'Urgente');
