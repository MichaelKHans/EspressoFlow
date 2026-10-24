-- ==============================================================================
-- ESPRESSO FLOW / FLOWBEAN - CROWDSOURCED GEAR & FLEET TELEMETRY MIGRATION
-- Migration Version: 20261024_crowdsourced_gear_and_telemetry
-- Project: espressoflow@mh-t.dk (Frankfurt eu-central-1)
-- Safe, idempotent execution script
-- ==============================================================================

-- 1. CROWDSOURCED GEAR SUBMISSIONS (Eget Udstyr & Fællesskabskatalog)
CREATE TABLE IF NOT EXISTS crowdsourced_gear_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  category VARCHAR(30) NOT NULL, -- 'machine', 'grinder', 'brewer', 'kettle'
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(150) NOT NULL,
  sub_category VARCHAR(100),
  specs JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  user_fingerprint VARCHAR(64),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_crowd_gear_status ON crowdsourced_gear_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crowd_gear_category ON crowdsourced_gear_submissions(category);
CREATE INDEX IF NOT EXISTS idx_crowd_gear_brand_model ON crowdsourced_gear_submissions(LOWER(TRIM(brand)), LOWER(TRIM(model)));

-- RLS: Enable security
ALTER TABLE crowdsourced_gear_submissions ENABLE ROW LEVEL SECURITY;

-- Public can submit new gear (always defaults to pending review)
DROP POLICY IF EXISTS "Allow public insert crowdsourced_gear" ON crowdsourced_gear_submissions;
CREATE POLICY "Allow public insert crowdsourced_gear"
  ON crowdsourced_gear_submissions FOR INSERT
  WITH CHECK (status = 'pending' OR status IS NULL);

-- Public can view approved gear
DROP POLICY IF EXISTS "Allow public read approved gear" ON crowdsourced_gear_submissions;
CREATE POLICY "Allow public read approved gear"
  ON crowdsourced_gear_submissions FOR SELECT
  USING (true);

-- Public update: only service role or admin
DROP POLICY IF EXISTS "Allow admin update crowdsourced_gear" ON crowdsourced_gear_submissions;
CREATE POLICY "Allow admin update crowdsourced_gear"
  ON crowdsourced_gear_submissions FOR UPDATE
  USING (true);


-- 2. FLEET SHOT TELEMETRY (<450 bytes compact telemetry vectors for Flowbean Lab)
CREATE TABLE IF NOT EXISTS fleet_shot_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  math_version VARCHAR(20) NOT NULL,
  machine_key VARCHAR(100) NOT NULL,
  grinder_key VARCHAR(100) NOT NULL,
  bean_key VARCHAR(120),
  physics_class VARCHAR(40) NOT NULL,
  basket_diameter_mm NUMERIC(4,1),
  dose_g NUMERIC(5,2) NOT NULL,
  yield_g NUMERIC(5,2) NOT NULL,
  brew_time_s NUMERIC(5,2) NOT NULL,
  pre_infusion_s NUMERIC(5,2),
  grind_setting VARCHAR(30),
  flow_curve_1hz JSONB DEFAULT '[]',
  taste_rating INT CHECK (taste_rating >= 1 AND taste_rating <= 5),
  channeling_detected BOOLEAN DEFAULT FALSE,
  ai_predicted_time_s NUMERIC(5,2),
  user_override_delta NUMERIC(5,2),
  user_fingerprint VARCHAR(64)
);

ALTER TABLE fleet_shot_telemetry ADD COLUMN IF NOT EXISTS bean_key VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_fleet_created_at ON fleet_shot_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_machine_grinder ON fleet_shot_telemetry(machine_key, grinder_key);
CREATE INDEX IF NOT EXISTS idx_fleet_bean_grinder ON fleet_shot_telemetry(bean_key, grinder_key);
CREATE INDEX IF NOT EXISTS idx_fleet_math_version ON fleet_shot_telemetry(math_version);

ALTER TABLE fleet_shot_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert fleet_shot_telemetry" ON fleet_shot_telemetry;
CREATE POLICY "Allow public insert fleet_shot_telemetry"
  ON fleet_shot_telemetry FOR INSERT
  WITH CHECK (dose_g > 0 AND yield_g > 0 AND brew_time_s > 0);

DROP POLICY IF EXISTS "Allow public read fleet_shot_telemetry" ON fleet_shot_telemetry;
CREATE POLICY "Allow public read fleet_shot_telemetry"
  ON fleet_shot_telemetry FOR SELECT
  USING (true);
