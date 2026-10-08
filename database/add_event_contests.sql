-- Vincular concursos a un festival/evento y agregar precio por concurso
-- (events.id es bigint, no uuid)
ALTER TABLE contests ADD COLUMN IF NOT EXISTS event_id BIGINT REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0;

-- Índice para queries por evento
CREATE INDEX IF NOT EXISTS idx_contests_event_id ON contests(event_id);
