-- Migration: add is_vit_chennai to team_members and populate from member_reg_no
-- Date: 2025-12-26

BEGIN;

-- Add column if missing
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS is_vit_chennai BOOLEAN;

-- Populate existing rows: if member_reg_no is present, mark as VIT Chennai
UPDATE team_members
SET is_vit_chennai = (member_reg_no IS NOT NULL)
WHERE is_vit_chennai IS NULL;

-- Add a comment for clarity
COMMENT ON COLUMN team_members.is_vit_chennai IS
  'Indicates if member is from VIT Chennai (true) or external college (false)';

COMMIT;
