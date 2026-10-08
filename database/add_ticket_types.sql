-- Tipos de ticket / planes de participación por evento
CREATE TABLE IF NOT EXISTS event_ticket_types (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  price_cents  INTEGER NOT NULL DEFAULT 0,
  capacity     INTEGER,          -- null = sin límite
  sort_order   INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar referencia de ticket type a registrations
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS ticket_type_id   BIGINT REFERENCES event_ticket_types(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS ticket_type_name VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON event_ticket_types(event_id);
