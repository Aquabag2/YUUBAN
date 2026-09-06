CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  event_id    INT REFERENCES events(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'announcement',
  -- tipos: announcement | schedule | result | winner
  title       TEXT NOT NULL,
  content     TEXT,
  is_pinned   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para cargar posts de un evento rápido
CREATE INDEX IF NOT EXISTS posts_event_id_idx ON posts(event_id, created_at DESC);
