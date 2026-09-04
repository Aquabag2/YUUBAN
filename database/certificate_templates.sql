-- Tabla de templates de constancias
CREATE TABLE IF NOT EXISTS certificate_templates (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  image_url     TEXT NOT NULL,         -- URL en Supabase Storage
  fields        JSONB NOT NULL DEFAULT '[]', -- posiciones de campos
  is_platform   BOOLEAN DEFAULT false, -- true = template oficial de Yuuban
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Relación evento → template seleccionado
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS certificate_template_id INT REFERENCES certificate_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS certificates_enabled BOOLEAN DEFAULT false;

-- Columna para guardar URL del PDF de la constancia generada
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Bucket de Supabase Storage (ejecutar solo si no existe)
-- Ve a Storage en Supabase y crea un bucket llamado "certificates" (público)
-- y otro llamado "certificate-templates" (público)
