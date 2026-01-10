-- Ensure all emails (both leaders and members) are unique across the entire system

-- Add unique constraint to member_email in team_members table
CREATE UNIQUE INDEX IF NOT EXISTS unique_member_email ON team_members(member_email) 
WHERE member_email IS NOT NULL;

-- Add unique constraint to lead_email in teams table (if not already exists)
CREATE UNIQUE INDEX IF NOT EXISTS unique_lead_email ON teams(lead_email);

-- Create a function to check if email exists anywhere
CREATE OR REPLACE FUNCTION check_email_uniqueness(email_to_check TEXT)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_email_uniqueness IS 'Returns TRUE if email is available, FALSE if already taken';
