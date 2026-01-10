-- Fix Security Advisor Warnings
-- This migration addresses the "Function Search Path Mutable" warnings
-- by setting search_path explicitly in all functions

-- =====================================================
-- Fix get_score_delta function
-- =====================================================
CREATE OR REPLACE FUNCTION get_score_delta(p_team_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a safe search_path to prevent search_path hijacking
SET search_path = public, pg_temp
AS $$
DECLARE
  current_score INTEGER;
  previous_score INTEGER;
BEGIN
  -- Get current score
  SELECT total_score INTO current_score
  FROM scorecards
  WHERE team_id = p_team_id;
  
  -- Get previous score (second most recent)
  SELECT total_score INTO previous_score
  FROM scorecard_history
  WHERE team_id = p_team_id
  ORDER BY recorded_at DESC
  OFFSET 1
  LIMIT 1;
  
  -- Return delta (0 if no previous score)
  RETURN COALESCE(current_score - previous_score, 0);
END;
$$;

-- =====================================================
-- Fix record_scorecard_change function
-- =====================================================
CREATE OR REPLACE FUNCTION record_scorecard_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a safe search_path to prevent search_path hijacking
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Record the new score in history
  INSERT INTO scorecard_history (
    team_id,
    ideavortex,
    review_1,
    review_2,
    review_3,
    pitch_vortex,
    total_score,
    snapshot_type
  ) VALUES (
    NEW.team_id,
    NEW.ideavortex,
    NEW.review_1,
    NEW.review_2,
    NEW.review_3,
    NEW.pitch_vortex,
    NEW.total_score,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'initial'
      ELSE 'update'
    END
  );
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Fix update_scorecard_timestamp function
-- =====================================================
CREATE OR REPLACE FUNCTION update_scorecard_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a safe search_path to prevent search_path hijacking
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

-- =====================================================
-- Fix is_team_owner helper function (from previous migration)
-- =====================================================
CREATE OR REPLACE FUNCTION is_team_owner(team_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a safe search_path to prevent search_path hijacking
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

-- =====================================================
-- Fix check_email_uniqueness function (from unique_emails migration)
-- =====================================================
CREATE OR REPLACE FUNCTION check_email_uniqueness(email_to_check TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a safe search_path to prevent search_path hijacking
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if email exists in teams table
  IF EXISTS (SELECT 1 FROM teams WHERE lead_email = email_to_check) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if email exists in team_members table
  IF EXISTS (SELECT 1 FROM team_members WHERE member_email = email_to_check) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- Add comments explaining the security fix
-- =====================================================
COMMENT ON FUNCTION get_score_delta(UUID) IS 
  'Calculates score delta with fixed search_path to prevent search_path hijacking attacks';

COMMENT ON FUNCTION record_scorecard_change() IS 
  'Records scorecard changes with fixed search_path to prevent search_path hijacking attacks';

COMMENT ON FUNCTION update_scorecard_timestamp() IS 
  'Updates scorecard timestamp with fixed search_path to prevent search_path hijacking attacks';

COMMENT ON FUNCTION is_team_owner(UUID) IS 
  'Checks team ownership with fixed search_path to prevent search_path hijacking attacks';

COMMENT ON FUNCTION check_email_uniqueness(TEXT) IS 
  'Checks email uniqueness with fixed search_path to prevent search_path hijacking attacks';
