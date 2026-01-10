import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zmcrdozxxclgzpltwpme.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptY3Jkb3p4eGNsZ3pwbHR3cG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzUwOTksImV4cCI6MjA4MDYxMTA5OX0.ecoF_ZdT19cpuu41OkR_lFI27yKMA1ZAtl3d2Z2AAnc'
);

async function checkLeaderboard() {
  // Check ALL teams
  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .select('id, team_name, lead_email, lead_name')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('\n=== TEAMS TABLE (Last 5) ===');
  if (teamError) {
    console.error('Error:', teamError);
  } else {
    console.log(JSON.stringify(teams, null, 2));
  }

  // Check leaderboard view
  const { data: leaderboard, error: lbError } = await supabase
    .from('leaderboard_view')
    .select('*')
    .order('position', { ascending: true })
    .limit(5);
  
  console.log('\n=== LEADERBOARD VIEW (Top 5) ===');
  if (lbError) {
    console.error('Error:', lbError);
  } else {
    console.log(JSON.stringify(leaderboard, null, 2));
  }
}

checkLeaderboard();
