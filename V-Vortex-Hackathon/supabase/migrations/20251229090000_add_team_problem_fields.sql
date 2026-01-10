-- Add columns to store selected domain and problem statement for teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS problem_statement TEXT,
  ADD COLUMN IF NOT EXISTS problem_description TEXT;

-- Optional: index for faster queries by domain
CREATE INDEX IF NOT EXISTS idx_teams_domain ON public.teams (domain);
