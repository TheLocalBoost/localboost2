-- Scans d'accessibilité (axe-core) — nouveau produit, sur le modèle de report_requests.
CREATE TABLE IF NOT EXISTS accessibility_scans (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name                  TEXT,
  domain                        TEXT NOT NULL,
  siren                         TEXT,
  employee_bracket              TEXT,   -- tranche INSEE ex: "10-19", "20-49" — null si inconnue
  contact_email                 TEXT,
  score                         INTEGER,   -- moyenne pondérée par nombre de nœuds sur toutes les pages scannées
  has_accessibility_statement   BOOLEAN,
  declaration_risk_flag         BOOLEAN,   -- true = pas de déclaration trouvée = risque amende 25 000€ (European Accessibility Act, ordonnance du 6 septembre 2023)
  total_violations              INTEGER,
  total_nodes                   INTEGER,
  pages                         JSONB,     -- détail par page : [{url, score, hasAccessibilityStatement, totalViolations, violations}]
  status                        TEXT DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'contacte', 'traite')),
  scanned_at                    TIMESTAMPTZ DEFAULT NOW(),
  created_at                    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accessibility_scans_domain_idx  ON accessibility_scans(domain);
CREATE INDEX IF NOT EXISTS accessibility_scans_status_idx  ON accessibility_scans(status);
CREATE INDEX IF NOT EXISTS accessibility_scans_risk_idx    ON accessibility_scans(declaration_risk_flag);

ALTER TABLE accessibility_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON accessibility_scans USING (true) WITH CHECK (true);
