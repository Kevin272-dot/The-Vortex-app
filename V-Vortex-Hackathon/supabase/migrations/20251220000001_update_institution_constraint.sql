-- Drop old constraints that prevented VIT Chennai students from having institution field
ALTER TABLE teams DROP CONSTRAINT IF EXISTS check_vit_or_institution;
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS check_member_vit_or_institution;

-- Add new constraints: must have EITHER (reg_no AND institution='VIT Chennai') OR (institution!=NULL AND reg_no=NULL)
ALTER TABLE teams 
ADD CONSTRAINT check_vit_or_institution 
CHECK (
  (lead_reg_no IS NOT NULL AND institution = 'VIT Chennai') OR 
  (lead_reg_no IS NULL AND institution IS NOT NULL)
);

ALTER TABLE team_members 
ADD CONSTRAINT check_member_vit_or_institution 
CHECK (
  (member_reg_no IS NOT NULL AND institution = 'VIT Chennai') OR 
  (member_reg_no IS NULL AND institution IS NOT NULL)
);

COMMENT ON CONSTRAINT check_vit_or_institution ON teams IS 'VIT Chennai students must have reg_no and institution=VIT Chennai. Other college students must have institution (EventHub ID) and no reg_no.';
COMMENT ON CONSTRAINT check_member_vit_or_institution ON team_members IS 'VIT Chennai members must have reg_no and institution=VIT Chennai. Other college members must have institution (EventHub ID) and no reg_no.';
