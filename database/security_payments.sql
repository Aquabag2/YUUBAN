-- ─── Yuuban — Poner la base al día + seguridad de inscripciones y pagos ──────
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query (todo el archivo de una vez)
-- Es seguro correrlo varias veces: solo crea lo que falta y se salta tablas que no existen.
-- Orden: 1) este archivo  2) hardening.sql

-- ── 1. Tablas y columnas que la app necesita ─────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS paid              BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS ticket_token      UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS checked_in        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at     TIMESTAMPTZ;

-- Planes de participación (Oyente, Concursante…)
CREATE TABLE IF NOT EXISTS event_ticket_types (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  price_cents  INTEGER NOT NULL DEFAULT 0,
  capacity     INTEGER,
  sort_order   INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON event_ticket_types(event_id);

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS ticket_type_id   BIGINT REFERENCES event_ticket_types(id),
  ADD COLUMN IF NOT EXISTS ticket_type_name VARCHAR(100);

-- Noticias del feed del alumno
CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  event_id    BIGINT REFERENCES events(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'announcement',  -- announcement | schedule | result | winner
  title       TEXT NOT NULL,
  content     TEXT,
  is_pinned   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS posts_event_id_idx ON posts(event_id, created_at DESC);

-- Constancias
CREATE TABLE IF NOT EXISTS certificate_templates (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  image_url     TEXT NOT NULL,
  fields        JSONB NOT NULL DEFAULT '[]',
  is_platform   BOOLEAN DEFAULT false,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS certificate_template_id INT REFERENCES certificate_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS certificates_enabled BOOLEAN DEFAULT false;
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Concursos y maestros (solo si esas tablas ya existen)
DO $$
BEGIN
  IF to_regclass('public.contests') IS NOT NULL THEN
    ALTER TABLE contests ADD COLUMN IF NOT EXISTS event_id BIGINT REFERENCES events(id) ON DELETE CASCADE;
    ALTER TABLE contests ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_contests_event_id ON contests(event_id);
  END IF;
  IF to_regclass('public.teachers') IS NOT NULL THEN
    ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;
  END IF;
END $$;

-- Buckets de archivos: fotos públicas, constancias privadas (se entregan con enlace firmado)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('teacher-photos',        'teacher-photos',        true),
  ('certificate-templates', 'certificate-templates', true),
  ('certificates',          'certificates',          false)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Correos en minúsculas ─────────────────────────────────────────────────
UPDATE registrations SET email = lower(trim(email)) WHERE email <> lower(trim(email));

-- ── 3. Sin inscripciones ni pagos duplicados ─────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM registrations GROUP BY event_id, email HAVING count(*) > 1) THEN
    RAISE NOTICE 'Hay correos inscritos dos veces al mismo evento; no se creó el índice único. Revisa con: SELECT event_id, email, count(*) FROM registrations GROUP BY 1, 2 HAVING count(*) > 1;';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_email_uniq ON registrations (event_id, email);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_stripe_session_uniq
  ON registrations (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- ── Comprobación ─────────────────────────────────────────────────────────────
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
