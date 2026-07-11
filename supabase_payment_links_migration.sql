-- Liens de paiement Stripe générés à la demande (vente négociée au cas par cas,
-- plus de page pricing publique à prix fixe). Trace qui a payé quoi, pour quel
-- montant réellement négocié.
CREATE TABLE IF NOT EXISTS payment_links (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   TEXT NOT NULL,
  nom                     TEXT NOT NULL,
  ville                   TEXT,
  tier                    TEXT NOT NULL CHECK (tier IN ('express', 'surMesure')),
  amount_cents            INTEGER NOT NULL,
  stripe_payment_link_id  TEXT NOT NULL UNIQUE,
  stripe_url              TEXT NOT NULL,
  status                  TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
  paid_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_links_status_idx ON payment_links(status);
CREATE INDEX IF NOT EXISTS payment_links_email_idx  ON payment_links(email);

-- Désactiver RLS pour l'accès admin via service role
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON payment_links USING (true) WITH CHECK (true);
