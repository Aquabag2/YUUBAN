-- Fotos de maestros
-- Ejecutar una vez en Supabase → SQL Editor.

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Bucket público para las fotos (el servidor también lo crea si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-photos', 'teacher-photos', true)
ON CONFLICT (id) DO NOTHING;
