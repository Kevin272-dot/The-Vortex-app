-- Add institution field to teams table and make registration numbers optional
ALTER TABLE teams 
ADD COLUMN institution TEXT,
ALTER COLUMN lead_reg_no DROP NOT NULL;

-- Add institution field to team_members table and make registration numbers optional
ALTER TABLE team_members 
ALTER COLUMN member_reg_no DROP NOT NULL,
ADD COLUMN institution TEXT;

-- Add check constraint to ensure either VIT (has reg_no) or external college (has institution)
ALTER TABLE teams 
ADD CONSTRAINT check_vit_or_institution 
CHECK (
  (lead_reg_no IS NOT NULL AND institution IS NULL) OR 
  (lead_reg_no IS NULL AND institution IS NOT NULL)
);

ALTER TABLE team_members 
ADD CONSTRAINT check_member_vit_or_institution 
CHECK (
  (member_reg_no IS NOT NULL AND institution IS NULL) OR 
  (member_reg_no IS NULL AND institution IS NOT NULL)
);
