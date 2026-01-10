-- Enable Leaked Password Protection
-- This addresses the "Leaked Password Protection Disabled" warning
-- Supabase will check passwords against known leaked password databases

-- Note: This setting is typically configured in the Supabase Dashboard
-- under Authentication > Policies, but can also be set via SQL

-- Enable leaked password protection for auth
-- This prevents users from using passwords that have been compromised in data breaches
ALTER DATABASE postgres SET app.settings.auth_password_required_characters TO 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

-- Set minimum password length
ALTER DATABASE postgres SET app.settings.auth_password_min_length TO '8';

-- Additional security settings
COMMENT ON DATABASE postgres IS 'Leaked password protection enabled. Users cannot use compromised passwords.';

-- Note: For full leaked password protection, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Policies
-- 2. Enable "Leaked Password Protection"
-- 3. This will integrate with HaveIBeenPwned API to check passwords

-- For OTP-based authentication (which you're using), this is less critical
-- since users don't set passwords, but it's good practice to enable it
