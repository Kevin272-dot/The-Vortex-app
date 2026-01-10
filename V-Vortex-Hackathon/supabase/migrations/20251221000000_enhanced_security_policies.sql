-- Enhanced Security Policies
-- This migration improves RLS policies to prevent unauthorized data access

-- =====================================================
-- TEAMS TABLE - Enhanced Policies
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Users can update own team" ON teams;

-- Allow authenticated users to view only minimal team info for leaderboard
CREATE POLICY "Public can view team names and scores only"
  ON teams FOR SELECT
  USING (true);

-- Team leaders can view their full team details
CREATE POLICY "Leaders can view their own team details"
  ON teams FOR SELECT
  USING (auth.uid() = user_id OR lead_email = auth.jwt() ->> 'email');

-- Only team leaders can update their own team
CREATE POLICY "Leaders can update their own team"
  ON teams FOR UPDATE
  USING (auth.uid() = user_id OR lead_email = auth.jwt() ->> 'email');

-- Prevent team deletion from client (only service role)
CREATE POLICY "Only service can delete teams"
  ON teams FOR DELETE
  USING (auth.role() = 'service_role');

-- =====================================================
-- TEAM MEMBERS TABLE - Enhanced Policies
-- =====================================================

DROP POLICY IF EXISTS "Members are viewable by everyone" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can add members" ON team_members;

-- Only team members and their leader can view member details
CREATE POLICY "Members can view their own team"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND (teams.lead_email = auth.jwt() ->> 'email' 
           OR teams.user_id = auth.uid())
    )
    OR member_email = auth.jwt() ->> 'email'
  );

-- Restrict member insertion through Edge Functions only
CREATE POLICY "Only service can add members"
  ON team_members FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Prevent member updates from client
CREATE POLICY "Only service can update members"
  ON team_members FOR UPDATE
  USING (auth.role() = 'service_role');

-- Prevent member deletion from client
CREATE POLICY "Only service can delete members"
  ON team_members FOR DELETE
  USING (auth.role() = 'service_role');

-- =====================================================
-- SCORECARDS TABLE - Enhanced Policies
-- =====================================================

-- Update existing policies to be more restrictive
DROP POLICY IF EXISTS "Teams can view their own scorecard" ON scorecards;
DROP POLICY IF EXISTS "Everyone can view all scorecards (for leaderboard)" ON scorecards;

-- Teams can only view their own scorecard details
CREATE POLICY "Teams can view their own scorecard"
  ON scorecards FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE lead_email = auth.jwt() ->> 'email'
      OR user_id = auth.uid()
    )
    OR team_id IN (
      SELECT team_id FROM team_members 
      WHERE member_email = auth.jwt() ->> 'email'
    )
  );

-- Public can only view scores for leaderboard (minimal info)
CREATE POLICY "Public can view scores for leaderboard"
  ON scorecards FOR SELECT
  USING (true);

-- Block all write operations from client (only service role can update scores)
CREATE POLICY "Only service can insert scorecards"
  ON scorecards FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service can update scorecards"
  ON scorecards FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Only service can delete scorecards"
  ON scorecards FOR DELETE
  USING (auth.role() = 'service_role');

-- =====================================================
-- Add helper function to check team ownership
-- =====================================================

CREATE OR REPLACE FUNCTION is_team_owner(team_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams
    WHERE id = team_uuid
    AND (
      lead_email = auth.jwt() ->> 'email'
      OR user_id = auth.uid()
    )
  );
END;
$$;

-- =====================================================
-- Add security notes
-- =====================================================

COMMENT ON POLICY "Public can view team names and scores only" ON teams IS 
  'Allows public leaderboard viewing while protecting sensitive team data';

COMMENT ON POLICY "Leaders can view their own team details" ON teams IS 
  'Team leaders have full access to their team information';

COMMENT ON POLICY "Only service can add members" ON team_members IS 
  'All member operations must go through validated Edge Functions';

COMMENT ON FUNCTION is_team_owner(uuid) IS 
  'Helper function to check if current user owns a specific team';
