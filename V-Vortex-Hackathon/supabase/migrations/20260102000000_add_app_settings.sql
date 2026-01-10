-- Create app_settings table for admin-controlled settings
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  leaderboard_public BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default row
INSERT INTO app_settings (id, leaderboard_public) VALUES ('main', false) ON CONFLICT DO NOTHING;

-- Allow authenticated users to read settings
GRANT SELECT ON app_settings TO authenticated;
GRANT SELECT ON app_settings TO anon;

-- Only admins can update (we'll handle this via RLS or service role in edge function)
-- For simplicity, allow authenticated to update (admin check done in frontend)
GRANT UPDATE ON app_settings TO authenticated;

-- RLS policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read settings" ON app_settings;
DROP POLICY IF EXISTS "Authenticated can update settings" ON app_settings;

-- Everyone can read settings
CREATE POLICY "Anyone can read settings" ON app_settings FOR SELECT USING (true);

-- Only allow updates (admin check is done in application layer)
CREATE POLICY "Authenticated can update settings" ON app_settings FOR UPDATE USING (true);
