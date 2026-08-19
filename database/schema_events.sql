-- ─── Yuuban — Eventos multi-tenant y registros públicos ──────────────────────
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query

-- 1. Agregar columnas a events para identificar al dueño y la URL pública
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS admin_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slug         TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_color  TEXT DEFAULT 'violet';

-- Índice para búsqueda rápida por slug
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_idx ON events (slug) WHERE slug IS NOT NULL;

-- Actualizar el evento de prueba con un slug de ejemplo
UPDATE events SET slug = 'festival-yuuban-2026', is_published = true WHERE slug IS NULL LIMIT 1;

-- 2. Tabla de inscripciones (pública — cualquiera puede registrarse)
CREATE TABLE IF NOT EXISTS registrations (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  instrument TEXT,
  notes      TEXT,
  status     TEXT DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'pendiente', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (registrarse) pero nadie puede leer excepto el admin via service_role
CREATE POLICY "Permitir registro público"
  ON registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo el admin del evento puede leer sus registros (vía el server con service_role, no directo)
-- El server usa service_role key que bypasea RLS, por eso no necesitamos política SELECT aquí.

-- 3. RLS en events — lectura pública de eventos publicados
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de eventos" ON events;
CREATE POLICY "Lectura pública de eventos"
  ON events FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin gestiona su evento" ON events;
CREATE POLICY "Admin gestiona su evento"
  ON events FOR ALL
  USING (admin_id = auth.uid());
