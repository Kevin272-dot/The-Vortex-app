-- Drop existing view if it exists
DROP VIEW IF EXISTS leaderboard_view;

-- Create a view for the leaderboard that combines teams and scorecards
CREATE VIEW leaderboard_view AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY COALESCE(s.total_score, 0) DESC, t.team_name ASC) as position,
  t.id as team_id,
  t.team_name,
  COALESCE(s.total_score, 0) as score,
  0 as delta,
  s.ideavortex,
  s.review_1,
  s.review_2,
  s.review_3,
  s.pitch_vortex
FROM teams t
LEFT JOIN scorecards s ON t.id = s.team_id
ORDER BY COALESCE(s.total_score, 0) DESC, t.team_name ASC;

-- Grant access to the view
GRANT SELECT ON leaderboard_view TO authenticated;
GRANT SELECT ON leaderboard_view TO anon;

COMMENT ON VIEW leaderboard_view IS 'Leaderboard ranking teams by total score with position numbers';
