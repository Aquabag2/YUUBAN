-- Activa RLS en todas las tablas que aparecen como UNRESTRICTED
-- El servidor usa service_role key que bypasea RLS automáticamente,
-- así que esto solo bloquea acceso directo con anon key desde clientes.

ALTER TABLE classes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_enrollments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_custom_fields   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_custom_field_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_enrollments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ticket_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites             ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_gallery      ENABLE ROW LEVEL SECURITY;
ALTER TABLE festivals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE news                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;

-- ── Políticas de lectura pública (contenido público del festival) ─────────────

-- Clases: lectura pública, escritura solo por admins vía servidor
CREATE POLICY "Lectura pública de clases"
  ON classes FOR SELECT USING (true);

-- Concursos: lectura pública
CREATE POLICY "Lectura pública de concursos"
  ON contests FOR SELECT USING (true);

-- Tipos de ticket: lectura pública (para mostrar precios)
CREATE POLICY "Lectura pública de tipos de ticket"
  ON event_ticket_types FOR SELECT USING (true);

-- Campos personalizados de eventos: lectura pública
CREATE POLICY "Lectura pública de campos de evento"
  ON event_custom_fields FOR SELECT USING (true);

-- Galería del festival: lectura pública
CREATE POLICY "Lectura pública de galería"
  ON festival_gallery FOR SELECT USING (true);

-- Festivales: lectura pública
CREATE POLICY "Lectura pública de festivales"
  ON festivals FOR SELECT USING (true);

-- Noticias: lectura pública
CREATE POLICY "Lectura pública de noticias"
  ON news FOR SELECT USING (true);

-- ── Políticas para datos de usuario (solo el propio usuario) ──────────────────

-- Favoritos: cada usuario ve solo los suyos
CREATE POLICY "Favoritos propios"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Insertar favoritos propios"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eliminar favoritos propios"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Notificaciones: cada usuario ve solo las suyas
CREATE POLICY "Notificaciones propias"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Inscripciones a eventos: cada usuario ve las suyas
CREATE POLICY "Inscripciones propias a eventos"
  ON event_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- Inscripciones a concursos: cada usuario ve las suyas
CREATE POLICY "Inscripciones propias a concursos"
  ON contest_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- Inscripciones al festival: cada usuario ve las suyas
CREATE POLICY "Inscripciones propias al festival"
  ON festival_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- Respuestas a campos personalizados: cada usuario ve las suyas
CREATE POLICY "Respuestas propias a campos"
  ON event_custom_field_responses FOR SELECT
  USING (auth.uid() = user_id);
