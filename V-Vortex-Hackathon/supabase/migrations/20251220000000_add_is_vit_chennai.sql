-- Add is_vit_chennai boolean column to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS is_vit_chennai BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN teams.is_vit_chennai IS 'Indicates if team leader is from VIT Chennai or external college';

-- Update existing records based on whether they have reg_no or institution
UPDATE teams 
SET is_vit_chennai = (lead_reg_no IS NOT NULL)
WHERE is_vit_chennai IS NULL;
