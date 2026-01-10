-- Add member_email column to team_members table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_members' AND column_name = 'member_email'
    ) THEN
        ALTER TABLE team_members ADD COLUMN member_email TEXT;
        COMMENT ON COLUMN team_members.member_email IS 'Gmail address for member login and OTP';
    END IF;
END $$;

-- Add qr_code_data column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_members' AND column_name = 'qr_code_data'
    ) THEN
        ALTER TABLE team_members ADD COLUMN qr_code_data TEXT UNIQUE;
        COMMENT ON COLUMN team_members.qr_code_data IS 'Unique QR code data for scanning';
    END IF;
END $$;
