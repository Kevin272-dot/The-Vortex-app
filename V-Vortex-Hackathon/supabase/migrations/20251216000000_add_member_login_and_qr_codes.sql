-- Add member_email column to team_members table
ALTER TABLE team_members
ADD COLUMN member_email TEXT;

-- Add QR code identifier for each member (unique per member)
ALTER TABLE team_members
ADD COLUMN qr_code_data TEXT UNIQUE;

-- Create session table for tracking attendance across 3 scanning rounds
CREATE TABLE member_attendance_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  session_number INTEGER NOT NULL, -- 1, 2, or 3
  session_name TEXT NOT NULL, -- "Round 1", "Round 2", "Round 3"
  is_active BOOLEAN DEFAULT true NOT NULL,
  CONSTRAINT valid_session_number CHECK (session_number BETWEEN 1 AND 3)
);

-- Create table to track which members were scanned in which session
CREATE TABLE member_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES member_attendance_sessions(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(member_id, session_id) -- Each member can only be scanned once per session
);

-- Create a table to store member login sessions (separate from team lead logins)
CREATE TABLE member_login_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for new tables
ALTER TABLE member_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_login_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for member_attendance_sessions (admin can manage, everyone can view active sessions)
CREATE POLICY "Attendance sessions viewable by everyone"
  ON member_attendance_sessions FOR SELECT USING (true);

CREATE POLICY "Admin can manage attendance sessions"
  ON member_attendance_sessions FOR ALL USING (true); -- TODO: Restrict to admin role in future

-- Policies for member_attendance (track who was scanned)
CREATE POLICY "Attendance records viewable by everyone"
  ON member_attendance FOR SELECT USING (true);

CREATE POLICY "Admin can record attendance"
  ON member_attendance FOR INSERT WITH CHECK (true); -- TODO: Restrict to admin role

-- Policies for member_login_sessions
CREATE POLICY "Members can view their own login session"
  ON member_login_sessions FOR SELECT USING (true); -- TODO: Restrict to own record

CREATE POLICY "System can create member login sessions"
  ON member_login_sessions FOR INSERT WITH CHECK (true);

-- Add comment
COMMENT ON TABLE member_attendance_sessions IS 'Tracks the 3 different scanning rounds for member attendance';
COMMENT ON TABLE member_attendance IS 'Records which members were scanned in which session';
COMMENT ON TABLE member_login_sessions IS 'Tracks member login sessions separately from team lead logins';
COMMENT ON COLUMN team_members.member_email IS 'Gmail address for member login and OTP';
COMMENT ON COLUMN team_members.qr_code_data IS 'Unique QR code data for scanning';
