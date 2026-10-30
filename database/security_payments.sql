-- ─── Yuuban — Seguridad de inscripciones y pagos ────────────────────────────
-- Ejecuta en: Supabase Dashboard → SQL Editor → New query

-- 0. Revisa duplicados ANTES de crear los índices (si esto devuelve filas, límpialas primero)
-- SELECT event_id, lower(email), count(*) FROM registrations GROUP BY 1, 2 HAVING count(*) > 1;

-- 1. Normaliza correos guardados con mayúsculas/espacios
UPDATE registrations SET email = lower(trim(email)) WHERE email <> lower(trim(email));

-- 2. Un correo solo puede inscribirse una vez por evento
CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_email_uniq
  ON registrations (event_id, email);

-- 3. Un pago de Stripe solo puede generar un boleto
CREATE UNIQUE INDEX IF NOT EXISTS registrations_stripe_session_uniq
  ON registrations (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- 4. El navegador solo usa Supabase para iniciar sesión; los datos pasan por la API
--    (service_role ignora RLS). Con RLS activo y sin políticas de escritura, el anon key
--    público NO puede leer correos de inscritos ni modificar nada aunque alguien lo copie.
ALTER TABLE registrations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ticket_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schedules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- 5. Comprobación: todas deben salir con rowsecurity = true
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
