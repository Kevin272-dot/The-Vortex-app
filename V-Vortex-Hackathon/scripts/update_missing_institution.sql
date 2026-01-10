-- Script: Find and update missing `institution` values (EventHub IDs)
-- Usage:
-- 1) Run the SELECT queries to list affected rows and their IDs.
-- 2) For each affected `teams.id` or `team_members.id`, replace <EVENTHUB_ID>
--    and run the corresponding UPDATE statement.
-- 3) Optionally wrap updates in a transaction.

-- --- Find affected teams (non-VIT leaders missing institution) ---
SELECT id, team_name, lead_name, lead_email, is_vit_chennai, institution, lead_reg_no
FROM teams
WHERE (is_vit_chennai = false OR is_vit_chennai IS NULL)
  AND (institution IS NULL OR TRIM(institution) = '');

-- --- Find affected team_members (non-VIT members missing institution) ---
SELECT id, team_id, member_name, member_email, is_vit_chennai, institution, member_reg_no
FROM team_members
WHERE (is_vit_chennai = false OR is_vit_chennai IS NULL)
  AND (institution IS NULL OR TRIM(institution) = '');

-- --- UPDATE templates ---
-- Replace <EVENTHUB_ID> with the actual EventHub Unique ID and <TEAM_UUID> / <MEMBER_UUID>

-- Update a team by id:
-- BEGIN;
-- UPDATE teams
-- SET institution = '<EVENTHUB_ID>'
-- WHERE id = '<TEAM_UUID>'
--   AND (institution IS NULL OR TRIM(institution) = '');
-- COMMIT;

-- Update a team_member by id:
-- BEGIN;
-- UPDATE team_members
-- SET institution = '<EVENTHUB_ID>'
-- WHERE id = '<MEMBER_UUID>'
--   AND (institution IS NULL OR TRIM(institution) = '');
-- COMMIT;

-- --- Bulk update example if you want to set the same EventHub ID for all affected rows ---
-- NOTE: Use with caution — ensure this is correct for every affected row before running.
-- BEGIN;
-- UPDATE teams
-- SET institution = '<EVENTHUB_ID>'
-- WHERE (is_vit_chennai = false OR is_vit_chennai IS NULL)
--   AND (institution IS NULL OR TRIM(institution) = '');

-- UPDATE team_members
-- SET institution = '<EVENTHUB_ID>'
-- WHERE (is_vit_chennai = false OR is_vit_chennai IS NULL)
--   AND (institution IS NULL OR TRIM(institution) = '');
-- COMMIT;

-- --- Verify updates ---
-- Re-run the SELECTs above to confirm there are no remaining missing institutions.
