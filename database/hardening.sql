-- ─── Yuuban — Endurecimiento de la base de datos ────────────────────────────
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query (todo el archivo de una vez)
--
-- Idea: el navegador SOLO usa Supabase para iniciar sesión. Todos los datos pasan por
-- la API (server/), que usa la service_role key y no está sujeta a RLS. Por eso aquí
-- se le quita TODO acceso directo a las tablas a los roles públicos (anon y authenticated).
-- La anon key que va dentro de la página web ya no sirve para leer ni escribir datos.
--
-- Es seguro correrlo varias veces. Corre ANTES security_payments.sql.

BEGIN;

-- ── 1. Quitar TODAS las políticas RLS del esquema public ─────────────────────
-- Había políticas USING (true) en registrations que dejaban leer correos y tokens de
-- boletos a cualquiera, e INSERT abiertos que dejaban crear inscripciones "pagadas".
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- ── 2. RLS activo (y forzado) en todas las tablas de public ──────────────────
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- ── 3. Sin privilegios para los roles públicos (doble candado además de RLS) ─
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, public;

-- Tablas y funciones que se creen en el futuro tampoco quedan abiertas
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, public;

-- El servidor sigue teniendo acceso completo
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ── 4. Función del trigger de registro: search_path fijo ─────────────────────
-- Una función SECURITY DEFINER sin search_path puede ser secuestrada creando objetos
-- con el mismo nombre en otro esquema.
DO $$
BEGIN
  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
  END IF;
END $$;

-- ── 5. Nadie puede auto-ascenderse a admin ───────────────────────────────────
-- Solo el servidor (service_role) o el SQL Editor pueden cambiar roles.
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- auth.role() es 'anon'/'authenticated' en peticiones desde el navegador,
  -- 'service_role' desde el servidor y NULL en el SQL Editor
  IF NEW.role IS DISTINCT FROM OLD.role AND coalesce(auth.role(), '') IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'No autorizado para cambiar el rol';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS user_profiles_protect_role ON public.user_profiles;
    CREATE TRIGGER user_profiles_protect_role
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION public.protect_user_role();
  END IF;
END $$;

-- ── 6. Datos válidos aunque alguien se salte la API ──────────────────────────
-- NOT VALID: no revisa filas viejas (no falla), sí todas las nuevas.
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_email_format;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_email_format
  CHECK (email = lower(trim(email)) AND email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' AND length(email) <= 254) NOT VALID;

ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_name_length;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_name_length
  CHECK (length(trim(name)) BETWEEN 1 AND 120) NOT VALID;

-- ── 7. Constancias privadas ──────────────────────────────────────────────────
-- Antes cualquiera podía bajar generated/1.pdf, 2.pdf… y ver nombres de inscritos.
-- La API ahora entrega enlaces firmados que caducan en 5 minutos.
UPDATE storage.buckets SET public = false WHERE id = 'certificates';

COMMIT;

-- ── 8. Comprobaciones (córrelas después, una por una) ────────────────────────
-- a) Todas las tablas con RLS → rowsecurity = true
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
--
-- b) Ninguna política en public → 0 filas
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
--
-- c) anon / authenticated sin permisos sobre tablas → 0 filas
-- SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
--  WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated');
--
-- d) Buckets: solo teacher-photos y certificate-templates deberían ser públicos
-- SELECT id, public FROM storage.buckets;
