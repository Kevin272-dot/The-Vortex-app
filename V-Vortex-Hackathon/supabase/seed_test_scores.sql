-- Insert test scorecards for existing teams
-- Note: Replace these team_ids with actual IDs from your teams table

-- This script will insert test scores for teams that exist in your database
-- Run this manually in Supabase SQL Editor after replacing team IDs

-- Example test data structure (customize with real team IDs):
/*
INSERT INTO scorecards (team_id, ideavortex, review_1, review_2, review_3, pitch_vortex, judge_comments)
VALUES 
  ('TEAM_ID_1', 85, 90, 78, 82, 80, 'Excellent innovation and solid implementation'),
  ('TEAM_ID_2', 92, 88, 95, 89, 90, 'Outstanding presentation with great impact'),
  ('TEAM_ID_3', 75, 80, 70, 77, 72, 'Good effort, needs improvement in presentation'),
  ('TEAM_ID_4', 88, 85, 92, 86, 88, 'Well-rounded project with strong execution'),
  ('TEAM_ID_5', 70, 72, 68, 71, 70, 'Decent concept, implementation could be better');
*/

-- Or use this dynamic approach to add scores to ALL existing teams:
-- WARNING: This will add random test scores to ALL teams in your database

DO $$
DECLARE
  team_record RECORD;
BEGIN
  FOR team_record IN SELECT id FROM teams LOOP
    INSERT INTO scorecards (
      team_id, 
      ideavortex,
      review_1,
      review_2,
      review_3,
      pitch_vortex,
      judge_comments
    )
    VALUES (
      team_record.id,
      FLOOR(RANDOM() * 40 + 60)::integer,  -- Random score between 60-100
      FLOOR(RANDOM() * 40 + 60)::integer,
      FLOOR(RANDOM() * 40 + 60)::integer,
      FLOOR(RANDOM() * 40 + 60)::integer,
      FLOOR(RANDOM() * 40 + 60)::integer,
      'Test evaluation - scores generated automatically'
    )
    ON CONFLICT (team_id) DO NOTHING;  -- Skip if scorecard already exists
  END LOOP;
END $$;
