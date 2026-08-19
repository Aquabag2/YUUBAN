-- ─── Yuuban — Auth: perfiles y roles ────────────────────────────────────────
-- Ejecuta esto en: Supabase Dashboard → SQL Editor → New query

-- Tabla de perfiles vinculada a auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Si ya existía la tabla, actualiza el CHECK para incluir los 3 roles
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('student', 'admin', 'super_admin'));

-- Política: cada usuario solo puede leer su propio perfil
DROP POLICY IF EXISTS "Leer perfil propio" ON user_profiles;
CREATE POLICY "Leer perfil propio"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Trigger: crea el perfil automáticamente al registrarse (rol por defecto: student)
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

-- ─── Asignar roles manualmente ────────────────────────────────────────────────
-- Corre esto UNA VEZ después de crear tu cuenta en la app.
-- Reemplaza el email con el tuyo:
--
-- Super Admin (tú):
-- UPDATE user_profiles SET role = 'super_admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL@aqui.com');
--
-- Admin (organizador de evento):
-- UPDATE user_profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'ADMIN@email.com');
