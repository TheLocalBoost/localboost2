-- Demandes de rapport déclenchées depuis le CTA de captation du funnel /analyser.
-- Source de vérité indépendante de l'email de notification (qui peut échouer/spammer).
CREATE TABLE IF NOT EXISTS report_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom                   TEXT NOT NULL,
  ville                 TEXT NOT NULL,
  secteur               TEXT,
  email                 TEXT,
  score                 INTEGER,
  completeness_percent  INTEGER,
  place_id              TEXT,
  diagnostic_url        TEXT,
  status                TEXT DEFAULT 'nouvelle' CHECK (status IN ('nouvelle', 'traitee')),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_requests_status_idx  ON report_requests(status);
CREATE INDEX IF NOT EXISTS report_requests_created_idx ON report_requests(created_at DESC);

-- Désactiver RLS pour l'accès admin via service role
ALTER TABLE report_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON report_requests USING (true) WITH CHECK (true);
