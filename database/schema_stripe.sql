-- ─── Yuuban — Stripe payment columns ─────────────────────────────────────────
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query

-- 1. Precio en centavos en la tabla events (0 = gratuito)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0;

-- 2. Columnas de pago en registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS paid              BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- ticket_token ya debería existir; si no, agrégalo:
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS ticket_token UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS checked_in        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at     TIMESTAMPTZ;
