-- FactureBoost — Migration complète
-- Exécuter dans Supabase SQL Editor

-- Profil FactureBoost
CREATE TABLE IF NOT EXISTS factureboost_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  iban           TEXT,
  bic            TEXT,
  banque         TEXT,
  tva_number     TEXT,
  siren          TEXT,
  micro_entrepreneur BOOLEAN DEFAULT FALSE,
  penalites_retard TEXT DEFAULT 'Pénalités de retard : taux directeur BCE + 10 points en cas de retard de paiement',
  escompte       TEXT DEFAULT 'Pas d''escompte pour règlement anticipé',
  chorus_pro_email TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Factures
CREATE TABLE IF NOT EXISTS factureboost_factures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  devis_id            UUID,
  client_id           UUID,
  numero              TEXT UNIQUE NOT NULL,
  type                TEXT DEFAULT 'facture' CHECK (type IN ('facture','avoir')),
  avoir_de            UUID REFERENCES factureboost_factures(id),
  titre               TEXT,
  lignes              JSONB NOT NULL DEFAULT '[]',
  total_ht            NUMERIC(12,2) NOT NULL DEFAULT 0,
  tva_details         JSONB DEFAULT '[]',
  total_tva           NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ttc           NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_regle       NUMERIC(12,2) DEFAULT 0,
  devise              TEXT DEFAULT 'EUR',
  date_emission       DATE NOT NULL,
  date_echeance       DATE NOT NULL,
  conditions_paiement TEXT DEFAULT 'Paiement à 30 jours date de facture',
  rib                 JSONB,
  statut              TEXT DEFAULT 'brouillon'
                      CHECK (statut IN ('brouillon','emise','envoyee','vue','payee','retard','litigieuse')),
  client_b2b          BOOLEAN DEFAULT FALSE,
  client_siren        TEXT,
  client_nom          TEXT,
  client_adresse      TEXT,
  client_email        TEXT,
  bon_commande        TEXT,
  adresse_livraison   TEXT,
  nature_transaction  TEXT DEFAULT 'prestation',
  pdf_url             TEXT,
  xml_facturx         TEXT,
  stripe_payment_link TEXT,
  stripe_payment_intent TEXT,
  penalites_retard    TEXT DEFAULT 'Pénalités de retard : taux légal × 3 en cas de retard de paiement.',
  escompte            TEXT DEFAULT 'Pas d''escompte pour règlement anticipé.',
  sent_at             TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  paid_at             TIMESTAMPTZ,
  relance_1_at        TIMESTAMPTZ,
  relance_2_at        TIMESTAMPTZ,
  relance_3_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factures_user    ON factureboost_factures(user_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut  ON factureboost_factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_created ON factureboost_factures(created_at);

-- Log immuable
CREATE TABLE IF NOT EXISTS factureboost_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID REFERENCES factureboost_factures(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id),
  action     TEXT NOT NULL,
  details    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_facture ON factureboost_logs(facture_id);

-- RLS
ALTER TABLE factureboost_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE factureboost_factures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE factureboost_logs      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"   ON factureboost_profiles  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_factures"  ON factureboost_factures  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_logs"      ON factureboost_logs      FOR ALL USING (auth.uid() = user_id);

-- Bucket storage factures (10 ans archivage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('factureboost-factures', 'factureboost-factures', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own_factures_storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'factureboost-factures' AND auth.uid()::text = (storage.foldername(name))[1]);
