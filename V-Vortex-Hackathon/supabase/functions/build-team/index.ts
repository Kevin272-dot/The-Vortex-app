import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/* =========================
   CORS
   ========================= */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    /* =========================
       1️⃣ AUTHENTICATION
       ========================= */
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Auth client (validates JWT)
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid session" }),
        { status: 401, headers: corsHeaders }
      );
    }

    /* =========================
       2️⃣ ADMIN CLIENT (DB)
       ========================= */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    /* =========================
       3️⃣ INPUT
       ========================= */
    const { teamId, teamName, teamSize, members } = await req.json();

    console.log("Building team:", {
      teamId,
      teamName,
      teamSize,
      memberCount: members?.length,
      caller: user.email,
    });

    if (!teamId || !teamName || !teamSize || !members) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (teamSize < 2 || teamSize > 5) {
      return new Response(
        JSON.stringify({ error: "Team size must be between 2 and 5" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (members.length !== teamSize - 1) {
      return new Response(
        JSON.stringify({
          error: `Expected ${teamSize - 1} members for team size ${teamSize}`,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* =========================
       4️⃣ AUTHORIZE TEAM OWNER
       ========================= */
    const { data: team } = await supabase
      .from("teams")
      .select("lead_email")
      .eq("id", teamId)
      .single();

    if (!team) {
      return new Response(
        JSON.stringify({ error: "Team not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (team.lead_email !== user.email) {
      return new Response(
        JSON.stringify({ error: "Not allowed to build this team" }),
        { status: 403, headers: corsHeaders }
      );
    }

    /* =========================
       5️⃣ VALIDATIONS
       ========================= */
    const { data: existingMembers } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId);

    if (existingMembers?.length) {
      return new Response(
        JSON.stringify({ error: "Team already has members" }),
        { status: 409, headers: corsHeaders }
      );
    }

    const memberEmails = members.map((m: any) => m.email);

    if (memberEmails.includes(team.lead_email)) {
      return new Response(
        JSON.stringify({
          error: "Team leader email cannot be used as a member email",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (new Set(memberEmails).size !== memberEmails.length) {
      return new Response(
        JSON.stringify({ error: "Duplicate member emails detected" }),
        { status: 400, headers: corsHeaders }
      );
    }

    for (const member of members) {
      const { data: exists } = await supabase
        .from("team_members")
        .select("id")
        .eq("member_email", member.email)
        .maybeSingle();

      if (exists) {
        return new Response(
          JSON.stringify({
            error: `Email ${member.email} is already registered`,
          }),
          { status: 409, headers: corsHeaders }
        );
      }
    }

    /* =========================
       6️⃣ UPDATE TEAM
       ========================= */
    // Prevent duplicate team names (case-insensitive). If another team
    // already uses this name, return a 409 conflict with a helpful message.
    const { data: nameConflict } = await supabase
      .from("teams")
      .select("id")
      .ilike("team_name", teamName)
      .neq("id", teamId)
      .limit(1);

    if (nameConflict && nameConflict.length > 0) {
      return new Response(
        JSON.stringify({ error: "Team name already in use" }),
        { status: 409, headers: corsHeaders }
      );
    }

    const { error: updateError } = await supabase
      .from("teams")
      .update({ team_name: teamName, team_size: teamSize })
      .eq("id", teamId);

    if (updateError) {
      // Map common unique-violation to a friendly 409 response.
      const msg = updateError.message || "Database update failed";
      if (msg.toLowerCase().includes("duplicate") || msg.includes("unique")) {
        return new Response(
          JSON.stringify({ error: "Team name already in use" }),
          { status: 409, headers: corsHeaders }
        );
      }

      throw new Error(msg);
    }

    /* =========================
       7️⃣ INSERT MEMBERS
       ========================= */
    const memberRecords = members.map((m: any) => ({
      team_id: teamId,
      member_name: m.name,
      member_email: m.email,
      member_reg_no: m.isVitChennai ? m.regNo ?? null : null,
      institution: m.isVitChennai ? "VIT Chennai" : m.eventHubId ?? null,
    }));

    await supabase.from("team_members").insert(memberRecords);

    /* =========================
       8️⃣ SCORECARD
       ========================= */
    const { data: scorecard } = await supabase
      .from("scorecards")
      .select("id")
      .eq("team_id", teamId)
      .maybeSingle();

    if (!scorecard) {
      await supabase.from("scorecards").insert({
        team_id: teamId,
        innovation_score: 0,
        implementation_score: 0,
        presentation_score: 0,
        impact_score: 0,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Team built successfully" }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Build team error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
