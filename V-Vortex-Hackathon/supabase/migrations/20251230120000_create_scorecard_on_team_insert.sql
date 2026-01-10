-- Auto-create a default scorecard when a new team is inserted
-- Run this migration as a DB admin / service role

CREATE OR REPLACE FUNCTION public.create_scorecard_for_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO scorecards (team_id)
  VALUES (NEW.id)
  ON CONFLICT (team_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_scorecard_after_team_insert ON teams;
CREATE TRIGGER trg_create_scorecard_after_team_insert
AFTER INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION public.create_scorecard_for_team();

-- Notes:
-- 1) The function is SECURITY DEFINER so it can insert even when RLS restricts client inserts.
-- 2) The INSERT uses ON CONFLICT to avoid duplicate scorecards for the same team.
-- 3) If you prefer to run this as a one-off SQL in Supabase SQL Editor, copy the function+trigger body there.
