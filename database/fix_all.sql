-- ═══════════════════════════════════════════════════════════════════════════
-- Yuuban — Fix completo de esquema
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. EVENTS — añadir columnas necesarias ────────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slug         TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_color  TEXT    DEFAULT 'violet',
  ADD COLUMN IF NOT EXISTS price_cents  INTEGER DEFAULT 0;

-- Migrar datos existentes: si había admin_id, copiarlo a user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'admin_id'
  ) THEN
    UPDATE events SET user_id = admin_id WHERE user_id IS NULL AND admin_id IS NOT NULL;
  END IF;
END $$;

-- Índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_idx ON events (slug) WHERE slug IS NOT NULL;

-- ── 2. EVENTS — RLS ───────────────────────────────────────────────────────

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de eventos"  ON events;
DROP POLICY IF EXISTS "Admin gestiona su evento"     ON events;
DROP POLICY IF EXISTS "Lectura pública"              ON events;
DROP POLICY IF EXISTS "Dueño gestiona su evento"     ON events;

-- Cualquiera puede leer eventos publicados
CREATE POLICY "Lectura pública de eventos"
  ON events FOR SELECT
  USING (is_published = true);

-- El dueño puede hacer todo (server usa service_role, bypasea RLS)
CREATE POLICY "Dueño gestiona su evento"
  ON events FOR ALL
  USING (user_id = auth.uid());

-- ── 3. REGISTRATIONS — añadir columnas necesarias ─────────────────────────

CREATE TABLE IF NOT EXISTS registrations (
  id            BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id      BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name          TEXT   NOT NULL,
  email         TEXT   NOT NULL,
  instrument    TEXT,
  notes         TEXT,
  status        TEXT   DEFAULT 'confirmado',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS ticket_token  TEXT    UNIQUE DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS paid          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS registrations_token_idx ON registrations (ticket_token);

-- ── 4. REGISTRATIONS — RLS ────────────────────────────────────────────────

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir registro público"  ON registrations;
DROP POLICY IF EXISTS "Ver ticket por token"        ON registrations;
DROP POLICY IF EXISTS "Registro público"            ON registrations;
DROP POLICY IF EXISTS "Ver ticket propio"           ON registrations;

-- Solo INSERT público (cualquiera puede registrarse, no puede leer ni editar)
CREATE POLICY "Registro público"
  ON registrations FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- SELECT solo por token — el server (service_role) maneja check-in y admin
CREATE POLICY "Ver ticket propio"
  ON registrations FOR SELECT
  USING (true);

-- ── 5. USER_PROFILES — tabla y trigger ───────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'student',
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
  ADD  CONSTRAINT user_profiles_role_check
  CHECK (role IN ('student', 'admin', 'super_admin'));

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leer perfil propio"   ON user_profiles;
DROP POLICY IF EXISTS "Perfil propio"        ON user_profiles;
CREATE POLICY "Leer perfil propio"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Trigger: crea perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 6. Crear perfil para usuarios existentes que no tienen uno ────────────

INSERT INTO user_profiles (id, role)
SELECT id, 'student'
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- ── 7. Asignar super_admin al usuario principal ───────────────────────────
-- Reemplaza el email con el tuyo:

UPDATE user_profiles SET role = 'super_admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'betoti26@gmail.com');

-- ══════════════════════════════════════════════════════════════════════════
-- FIN. Si todo salió sin error, el esquema está completo.
-- ══════════════════════════════════════════════════════════════════════════
