-- LocalBoost Features — Migration
-- Exécuter dans Supabase SQL Editor

-- Profil LocalBoost (Place ID Google + lien avis)
CREATE TABLE IF NOT EXISTS localboost_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  google_place_id   TEXT,
  google_review_link TEXT,
  business_name     TEXT,
  business_address  TEXT,
  business_phone    TEXT,
  business_website  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Demandes d'avis clients
CREATE TABLE IF NOT EXISTS localboost_review_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name  TEXT NOT NULL,
  client_email TEXT,
  prestation   TEXT,
  review_link  TEXT NOT NULL,
  status       TEXT DEFAULT 'sent' CHECK (status IN ('sent','reminded','done')),
  sent_at      TIMESTAMPTZ DEFAULT NOW(),
  reminded_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_user   ON localboost_review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON localboost_review_requests(status);

-- Colonne business_impact sur search_cache (pour l'analyzer)
ALTER TABLE search_cache ADD COLUMN IF NOT EXISTS business_impact JSONB;

-- RLS
ALTER TABLE localboost_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE localboost_review_requests  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_lb_profile"  ON localboost_profiles        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_lb_reviews"  ON localboost_review_requests FOR ALL USING (auth.uid() = user_id);
