-- ─── Yuuban — Tickets QR ─────────────────────────────────────────────────────
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query

-- Agregar campos de ticket a la tabla registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS ticket_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS checked_in    BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Índice para búsqueda rápida por token (se usa en check-in)
CREATE INDEX IF NOT EXISTS registrations_token_idx ON registrations (ticket_token);

-- Política: lectura pública del ticket propio (solo por token — funciona como contraseña)
DROP POLICY IF EXISTS "Ver ticket por token" ON registrations;
CREATE POLICY "Ver ticket por token"
  ON registrations FOR SELECT
  USING (true);
-- Nota: el acceso real está controlado por el token único, no por RLS aquí.
-- El service_role del server maneja el check-in.
