-- Add receipt_link column to teams table for payment verification
ALTER TABLE teams 
ADD COLUMN receipt_link TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN teams.receipt_link IS 'Google Drive link to payment receipt for manual verification';
