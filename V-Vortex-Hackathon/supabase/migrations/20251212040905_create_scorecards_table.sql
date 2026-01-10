-- Create scorecards table
CREATE TABLE scorecards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  
  -- Scoring fields (updated naming to match review stages)
  ideavortex integer DEFAULT 0 CHECK (ideavortex >= 0 AND ideavortex <= 100),
  review_1 integer DEFAULT 0 CHECK (review_1 >= 0 AND review_1 <= 100),
  review_2 integer DEFAULT 0 CHECK (review_2 >= 0 AND review_2 <= 100),
  -- Review 3 is weighted (scaled) in the admin UI; allow up to 165 to accommodate weighting
  review_3 integer DEFAULT 0 CHECK (review_3 >= 0 AND review_3 <= 165),
  pitch_vortex integer DEFAULT 0 CHECK (pitch_vortex >= 0 AND pitch_vortex <= 100),

  total_score integer GENERATED ALWAYS AS (ideavortex + review_1 + review_2 + review_3 + pitch_vortex) STORED,
  
  judge_comments text,
  
  UNIQUE(team_id)
);

-- Enable RLS
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teams can view their own scorecard"
  ON scorecards FOR SELECT
  USING (team_id IN (
    SELECT id FROM teams WHERE lead_email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Everyone can view all scorecards (for leaderboard)"
  ON scorecards FOR SELECT
  USING (true);

-- Admin can insert/update scorecards (you'll need to add admin role later)
CREATE POLICY "Service role can manage scorecards"
  ON scorecards FOR ALL
  USING (auth.role() = 'service_role');
