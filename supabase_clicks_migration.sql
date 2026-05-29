-- Migration : tracking des clics par variante email
-- À exécuter dans Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS email_clicks (
  id         BIGSERIAL PRIMARY KEY,
  lead_id    BIGINT,
  variant_id INT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_clicks_variant ON email_clicks(variant_id);
CREATE INDEX IF NOT EXISTS idx_email_clicks_lead    ON email_clicks(lead_id);
