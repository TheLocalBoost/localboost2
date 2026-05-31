-- Analytics table
CREATE TABLE IF NOT EXISTS page_views (
  id         BIGSERIAL PRIMARY KEY,
  path       TEXT        NOT NULL,
  referrer   TEXT,
  country    TEXT,
  device     TEXT,        -- 'mobile' | 'tablet' | 'desktop'
  utm_source TEXT,
  utm_medium TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pv_path    ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_pv_country ON page_views(country);

-- Events table (signup, waitlist, clic CTA...)
CREATE TABLE IF NOT EXISTS analytics_events (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,  -- 'signup', 'waitlist', 'cta_click', 'analyzer_used'
  path       TEXT,
  meta       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_name    ON analytics_events(name);
CREATE INDEX IF NOT EXISTS idx_evt_created ON analytics_events(created_at);
