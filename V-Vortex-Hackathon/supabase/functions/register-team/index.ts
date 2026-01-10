import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

    try {
    // Create Supabase client using the anon key and forward the caller's
    // Authorization header so DB operations run as the caller (RLS applies).
    // Use the service role key for server-side trusted operations so RLS
    // doesn't block legitimate inserts from the function. This key must
    // only be available in the function's environment variables.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Log incoming headers and raw body to help debug client differences
    try {
      const rawBody = await req.text();
      console.log("Incoming request headers:", Object.fromEntries(req.headers.entries()));
      console.log("Incoming raw body:", rawBody);

      // Parse body from raw text (preserves logging above)
      var parsedBody = rawBody ? JSON.parse(rawBody) : {};
    } catch (logErr) {
      console.error("Failed to log/parse request body:", logErr);
      var parsedBody = {};
    }

    const { isVitChennai, eventHubId, leaderName, leaderReg, leaderEmail, receiptLink } = parsedBody;
    console.log("Received team leader registration:", { leaderEmail, isVitChennai, receiptLink });

    // Quick schema check to fail fast if deployed function is running against
    // a DB with a mismatched schema (avoids obscure PostgREST cache errors).
    const { error: schemaCheckError } = await supabase.from("teams").select("lead_name").limit(0);
    if (schemaCheckError) {
      console.error("Schema validation failed:", schemaCheckError);
      throw new Error(`Schema validation failed: ${schemaCheckError.message}`);
    }

    // Validate input - conditional validation based on VIT Chennai status
    if (!leaderName || !leaderEmail || !receiptLink) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate VIT Chennai students have reg numbers
    if (isVitChennai === "yes" && !leaderReg) {
      return new Response(
        JSON.stringify({ error: "VIT Chennai students must provide registration number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate non-VIT students have eventHubId
    if (isVitChennai === "no" && !eventHubId) {
      return new Response(
        JSON.stringify({ error: "Non-VIT students must provide EventHub Unique ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate leader email in teams table
    const { data: existingLeadEmail } = await supabase
      .from("teams")
      .select("id")
      .eq("lead_email", leaderEmail)
      .maybeSingle();

    if (existingLeadEmail) {
      return new Response(
        JSON.stringify({ error: "This email is already registered as a team leader. Each email can only be used once." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if leader email exists in team_members table
    const { data: existingMemberEmail } = await supabase
      .from("team_members")
      .select("id")
      .eq("member_email", leaderEmail)
      .maybeSingle();

    if (existingMemberEmail) {
      return new Response(
        JSON.stringify({ error: "This email is already registered as a team member. Each email can only be used once." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Insert team leader into database (team not fully formed yet)
    // Generate random temporary team name
    const randomId = crypto.randomUUID().split('-')[0].toUpperCase();
    const teamData = {
      team_name: `TEMP-${randomId}`, // Temporary random name, will be updated when building team
      team_size: 2, // Set to minimum size (2) to satisfy constraint, will be updated when building team
      lead_name: leaderName,
      // For VIT Chennai leaders we store `lead_reg_no` and leave `institution` NULL to satisfy the
      // check constraint added in migrations. For non-VIT leaders we store `institution` and leave
      // `lead_reg_no` NULL.
      lead_reg_no: isVitChennai === "yes" ? leaderReg : null,
      // Store a readable institution value for VIT leaders as requested.
      institution: isVitChennai === "no" ? eventHubId : "VIT Chennai",
      lead_email: leaderEmail,
      receipt_link: receiptLink,
    };
    
    console.log("Inserting team leader data:", teamData);
    
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert(teamData)
      .select()
      .single();

    if (teamError) {
      console.error("Database error:", teamError);
      throw new Error(`Database error: ${teamError.message}`);
    }
    
    console.log("Team leader registered successfully:", team.id);

    return new Response(
      JSON.stringify({ success: true, teamId: team.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
