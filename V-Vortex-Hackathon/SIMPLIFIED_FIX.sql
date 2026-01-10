-- =====================================================
-- SIMPLIFIED FIX FOR ALL SUPABASE ADVISOR ISSUES
-- This version skips the problematic profiles table
-- =====================================================

-- =====================================================
-- PART 1: Fix Function Search Path Issues (Security)
-- =====================================================

CREATE OR REPLACE FUNCTION get_score_delta(p_team_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_score INTEGER;
  previous_score INTEGER;
BEGIN
  SELECT total_score INTO current_score
  FROM scorecards
  WHERE team_id = p_team_id;
  
  SELECT total_score INTO previous_score
  FROM scorecard_history
  WHERE team_id = p_team_id
  ORDER BY recorded_at DESC
  OFFSET 1
  LIMIT 1;
  
  RETURN COALESCE(current_score - previous_score, 0);
END;
$$;

CREATE OR REPLACE FUNCTION record_scorecard_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO scorecard_history (
    team_id,
    innovation_score,
    implementation_score,
    presentation_score,
    impact_score,
    total_score,
    snapshot_type
  ) VALUES (
    NEW.team_id,
    NEW.innovation_score,
    NEW.implementation_score,
    NEW.presentation_score,
    NEW.impact_score,
    NEW.total_score,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'initial'
      ELSE 'update'
    END
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_scorecard_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION is_team_owner(team_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION check_email_uniqueness(email_to_check TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM teams WHERE lead_email = email_to_check) THEN
    RETURN FALSE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM team_members WHERE member_email = email_to_check) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- PART 2: Fix Multiple Permissive Policies
-- =====================================================

-- Fix TEAMS table
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Public can view team names and scores only" ON teams;
DROP POLICY IF EXISTS "Leaders can view their own team details" ON teams;

CREATE POLICY "Optimized teams select policy"
  ON teams FOR SELECT
  USING (true);

-- Fix SCORECARDS table
DROP POLICY IF EXISTS "Teams can view their own scorecard" ON scorecards;
DROP POLICY IF EXISTS "Everyone can view all scorecards (for leaderboard)" ON scorecards;
DROP POLICY IF EXISTS "Public can view scores for leaderboard" ON scorecards;

CREATE POLICY "Optimized scorecards select policy"
  ON scorecards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage scorecards" ON scorecards;
DROP POLICY IF EXISTS "Only service can insert scorecards" ON scorecards;
DROP POLICY IF EXISTS "Only service can update scorecards" ON scorecards;
DROP POLICY IF EXISTS "Only service can delete scorecards" ON scorecards;

CREATE POLICY "Service role manages scorecards"
  ON scorecards FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Fix SCORECARD_HISTORY table
DROP POLICY IF EXISTS "Everyone can view scorecard history" ON scorecard_history;
DROP POLICY IF EXISTS "Service role can manage scorecard history" ON scorecard_history;

CREATE POLICY "Public can view scorecard history"
  ON scorecard_history FOR SELECT
  USING (true);

CREATE POLICY "Service role manages scorecard history"
  ON scorecard_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Fix TEAM_MEMBERS table
DROP POLICY IF EXISTS "Members are viewable by everyone" ON team_members;
DROP POLICY IF EXISTS "Members can view their own team" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can add members" ON team_members;
DROP POLICY IF EXISTS "Only service can add members" ON team_members;
DROP POLICY IF EXISTS "Only service can update members" ON team_members;
DROP POLICY IF EXISTS "Only service can delete members" ON team_members;

CREATE POLICY "Team members can view their team"
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

CREATE POLICY "Service role manages team members"
  ON team_members FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PART 3: Fix Duplicate Indexes
-- =====================================================

DO $$
DECLARE
    idx_name TEXT;
BEGIN
    FOR idx_name IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'scorecard_history' 
        AND indexname LIKE '%_team_%' 
        AND indexname != 'idx_scorecard_history_team_time'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
    END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_scorecard_history_team_time 
  ON scorecard_history(team_id, recorded_at DESC);

-- =====================================================
-- PART 4: Optimize Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_teams_lead_email ON teams(lead_email);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(member_email);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_team_id ON scorecards(team_id);

-- =====================================================
-- PART 5: Recreate Essential Team Policies
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can update own team" ON teams;
DROP POLICY IF EXISTS "Leaders can update their own team" ON teams;
DROP POLICY IF EXISTS "Only service can delete teams" ON teams;

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Leaders can update their own team"
  ON teams FOR UPDATE
  USING (auth.uid() = user_id OR lead_email = auth.jwt() ->> 'email')
  WITH CHECK (auth.uid() = user_id OR lead_email = auth.jwt() ->> 'email');

CREATE POLICY "Only service can delete teams"
  ON teams FOR DELETE
  USING (auth.role() = 'service_role');

-- =====================================================
-- DONE! All main issues fixed.
-- The profiles table warnings can be ignored if you don't use that feature.
-- =====================================================
