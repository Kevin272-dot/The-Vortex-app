
create table teams (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  team_name text not null,
  team_size integer not null,
  
  -- Team Lead Details
  lead_name text not null,
  lead_reg_no text not null,
  lead_email text not null, 
  
  user_id uuid references auth.users default auth.uid(),
  
  -- Constraint: Team size must be between 2 and 5
  constraint valid_team_size check (team_size >= 2 and team_size <= 5)
);

-- This table stores the details of the additional members (excluding the lead)
create table team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  
  member_name text not null,
  member_reg_no text not null
);

alter table teams enable row level security;
alter table team_members enable row level security;

-- Policies for TEAMS
-- 1. Everyone can view teams (useful for leaderboards)
create policy "Teams are viewable by everyone" 
  on teams for select using (true);

-- 2. Only authenticated users can create a team
create policy "Authenticated users can create teams" 
  on teams for insert with check (auth.role() = 'authenticated');

-- 3. Users can only update their own team
create policy "Users can update own team" 
  on teams for update using (auth.uid() = user_id);

-- Policies for TEAM MEMBERS
-- 1. Everyone can view members
create policy "Members are viewable by everyone" 
  on team_members for select using (true);

-- 2. Authenticated users can add members (usually done at same time as team creation)
create policy "Authenticated users can add members" 
  on team_members for insert with check (auth.role() = 'authenticated');
