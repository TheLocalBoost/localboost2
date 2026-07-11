-- Positions Google Maps par mot-clé (diagnostic sur-mesure)
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id     TEXT NOT NULL,
  city         TEXT NOT NULL,
  keyword      TEXT NOT NULL,
  is_generic   BOOLEAN DEFAULT FALSE,
  position     INTEGER,
  scanned      INTEGER,
  rating       NUMERIC,
  review_count INTEGER,
  checked_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS keyword_rankings_place_idx   ON keyword_rankings(place_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS keyword_rankings_checked_idx ON keyword_rankings(checked_at);

-- Désactiver RLS pour l'accès admin via service role
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON keyword_rankings USING (true) WITH CHECK (true);
