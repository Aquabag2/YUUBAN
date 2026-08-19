-- ─── Yuuban — Clientes (admins que rentan la plataforma) ────────────────────
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS clients (
  id          SERIAL PRIMARY KEY,
  admin_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  contact     TEXT,
  email       TEXT NOT NULL UNIQUE,
  plan        TEXT DEFAULT 'Básico' CHECK (plan IN ('Básico', 'Pro', 'Enterprise')),
  status      TEXT DEFAULT 'Activo'  CHECK (status IN ('Activo', 'Pausado', 'Cancelado')),
  mrr         INTEGER DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Solo el service_role (server) puede operar esta tabla
-- No necesita políticas RLS adicionales porque el server usa service_role key
