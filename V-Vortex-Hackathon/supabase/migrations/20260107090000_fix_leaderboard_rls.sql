-- Fix leaderboard exposure by tightening RLS and app_settings update policy

-- 1) Restrict scorecards SELECT to when leaderboard is public OR caller is admin/service
DROP POLICY IF EXISTS "Everyone can view all scorecards (for leaderboard)" ON scorecards;

CREATE POLICY "Leaderboard visible when enabled or admin/service" ON scorecards
  FOR SELECT
  USING (
    -- allow if app setting is enabled
    (SELECT leaderboard_public FROM app_settings WHERE id = 'main')
    -- OR allow if caller is admin (app_metadata.role = 'admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    -- OR allow if this is a service role (edge function / server)
    OR auth.role() = 'service_role'
  );

-- 2) Tighten who can UPDATE app_settings (only admins / service role)
DROP POLICY IF EXISTS "Authenticated can update settings" ON app_settings;

CREATE POLICY "Admins or service role can update settings" ON app_settings
  FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR auth.role() = 'service_role'
  );

-- Optional: Prevent anonymous from seeing leaderboard_view directly (defense in depth)
-- If you want anonymous users not to be able to query the view at all, uncomment the next two lines.
-- REVOKE SELECT ON leaderboard_view FROM anon;
-- REVOKE SELECT ON leaderboard_view FROM authenticated; -- keep this if you prefer app-layer gating

-- Notes:
-- - This migration relies on the app_settings table existing with a row id='main'.
-- - After applying, only admins/service role can flip leaderboard visibility. The frontend should call an admin-only endpoint or update using a JWT with app_metadata.role='admin'.
-- - To test: connect as an ordinary authenticated user and confirm SELECT from leaderboard_view returns zero rows when leaderboard_public=false, and returns rows when true. Admin/service should always see rows.
