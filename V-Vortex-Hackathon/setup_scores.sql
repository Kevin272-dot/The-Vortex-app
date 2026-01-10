-- Run this in Supabase SQL Editor to set up scores

-- Step 1: Create the leaderboard view with exact format needed by frontend
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY COALESCE(s.total_score, 0) DESC, t.team_name ASC) as position,
  t.team_name,
  COALESCE(s.total_score, 0) as score,
  0 as delta, -- Delta changes - will be calculated from historical data in future
  t.id as team_id,
  s.innovation_score,
  s.implementation_score,
  s.presentation_score,
  s.impact_score,
  COALESCE(s.total_score, 0) as total_score
FROM teams t
LEFT JOIN scorecards s ON t.id = s.team_id
ORDER BY COALESCE(s.total_score, 0) DESC, t.team_name ASC;

-- Step 2: Grant permissions
GRANT SELECT ON leaderboard_view TO authenticated;
GRANT SELECT ON leaderboard_view TO anon;

-- Step 3: Add test scores to all existing teams (OPTIONAL - for testing)
-- Comment out if you don't want random scores
DO $$
DECLARE
  team_record RECORD;
  innovation INT;
  implementation INT;
  presentation INT;
  impact INT;
BEGIN
  FOR team_record IN SELECT id, team_name FROM teams LOOP
    -- Generate random scores between 65-95 for realistic data
    innovation := FLOOR(RANDOM() * 30 + 65)::integer;
    implementation := FLOOR(RANDOM() * 30 + 65)::integer;
    presentation := FLOOR(RANDOM() * 30 + 65)::integer;
    impact := FLOOR(RANDOM() * 30 + 65)::integer;
    
    INSERT INTO scorecards (
      team_id, 
      innovation_score, 
      implementation_score, 
      presentation_score, 
      impact_score,
      judge_comments
    )
    VALUES (
      team_record.id,
      innovation,
      implementation,
      presentation,
      impact,
      'Test scores - Team: ' || team_record.team_name
    )
    ON CONFLICT (team_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Test scores added successfully!';
END $$;

-- Step 4: Verify the leaderboard
SELECT * FROM leaderboard_view LIMIT 10;

-- Step 5: (OPTIONAL) Add some historical data to see delta changes
-- This simulates score updates to show delta in action
-- Uncomment to create fake score progression:

/*
-- Wait a moment then update some scores to create history
DO $$
DECLARE
  team_record RECORD;
BEGIN
  -- Update scores for top 3 teams to simulate progression
  FOR team_record IN 
    SELECT id FROM scorecards ORDER BY total_score DESC LIMIT 3
  LOOP
    -- Small score increase (simulate improvement)
    UPDATE scorecards 
    SET 
      innovation_score = LEAST(100, innovation_score + FLOOR(RANDOM() * 10)::integer),
      implementation_score = LEAST(100, implementation_score + FLOOR(RANDOM() * 10)::integer)
    WHERE team_id = team_record.id;
  END LOOP;
  
  RAISE NOTICE 'Score updates applied - deltas should now show changes!';
END $$;

-- Check the leaderboard again to see deltas
SELECT position, team_name, score, delta FROM leaderboard_view LIMIT 10;
*/
