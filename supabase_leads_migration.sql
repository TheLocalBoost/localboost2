-- Table des leads outreach
CREATE TABLE IF NOT EXISTS leads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom         TEXT,
  email       TEXT UNIQUE NOT NULL,
  secteur     TEXT,
  ville       TEXT,
  phone       TEXT,
  address     TEXT,
  site        TEXT,
  sent        BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_sent_idx ON leads(sent);
CREATE INDEX IF NOT EXISTS leads_secteur_idx ON leads(secteur);

-- Désactiver RLS pour l'accès admin via service role
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON leads USING (true) WITH CHECK (true);
