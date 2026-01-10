ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_size integer NOT NULL DEFAULT 2;

ALTER TABLE teams DROP CONSTRAINT IF EXISTS valid_team_size;
ALTER TABLE teams ADD CONSTRAINT valid_team_size CHECK (team_size >= 2 AND team_size <= 5);
