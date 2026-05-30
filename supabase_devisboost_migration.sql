-- ═══════════════════════════════════════════════════════════
-- DevisBoost — Migration Supabase
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Profil artisan
CREATE TABLE IF NOT EXISTS devisboost_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name    TEXT,
  siret           TEXT,
  metier          TEXT,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  payment_conditions TEXT DEFAULT 'Acompte de 30% à la commande, solde à la livraison',
  mentions_legales   TEXT,
  tva_number      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS devisboost_clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devis
CREATE TABLE IF NOT EXISTS devisboost_devis (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id            UUID REFERENCES devisboost_clients(id) ON DELETE SET NULL,
  numero               TEXT UNIQUE,
  titre                TEXT,
  description_chantier TEXT,
  lignes               JSONB DEFAULT '[]',
  total_ht             NUMERIC(10,2) DEFAULT 0,
  tva_taux             NUMERIC(5,2)  DEFAULT 10,
  tva_montant          NUMERIC(10,2) DEFAULT 0,
  total_ttc            NUMERIC(10,2) DEFAULT 0,
  delai_jours          INTEGER DEFAULT 5,
  validite_jours       INTEGER DEFAULT 30,
  statut               TEXT DEFAULT 'brouillon',
  notes                TEXT,
  conditions           TEXT,
  pdf_url              TEXT,
  sent_at              TIMESTAMPTZ,
  opened_at            TIMESTAMPTZ,
  accepted_at          TIMESTAMPTZ,
  relance_sent_at      TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Numérotation automatique ────────────────────────────────
CREATE OR REPLACE FUNCTION generate_devis_numero(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year  TEXT;
  v_count INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO v_count
  FROM devisboost_devis
  WHERE user_id = p_user_id
    AND numero LIKE 'DEV-' || v_year || '-%';
  RETURN 'DEV-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- ── updated_at automatique ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER devisboost_devis_updated_at
  BEFORE UPDATE ON devisboost_devis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER devisboost_profiles_updated_at
  BEFORE UPDATE ON devisboost_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE devisboost_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devisboost_clients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE devisboost_devis    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON devisboost_profiles USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_clients" ON devisboost_clients  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_devis"   ON devisboost_devis    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Storage bucket logos ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('devisboost-logos', 'devisboost-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "logos_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'devisboost-logos' AND auth.role() = 'authenticated');
CREATE POLICY "logos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'devisboost-logos');
