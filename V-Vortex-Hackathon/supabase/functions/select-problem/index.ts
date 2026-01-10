import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    // Strictly require a Bearer token to avoid SDK inconsistencies with malformed headers
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Invalid authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid session" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
    }

    const { teamId, domain, problemName, problemDescription } = body || {};

    if (!teamId || !domain || !problemName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    // verify team exists and user is lead
    const { data: team } = await supabase.from("teams").select("lead_email").eq("id", teamId).maybeSingle();

    if (!team) {
      return new Response(JSON.stringify({ error: "Team not found" }), { status: 404, headers: corsHeaders });
    }

    // Compare emails case-insensitively to avoid casing mismatches
    if ((team.lead_email || "").toLowerCase() !== (user.email || "").toLowerCase()) {
      return new Response(JSON.stringify({ error: "Not allowed: only team lead can assign problem" }), { status: 403, headers: corsHeaders });
    }

    // Expect a problem-statement id (psId) to perform an atomic check + seat lock
    let psId = body.psId || body.ps_id;

    // If client did not provide a psId, attempt to find a matching problem statement by title+domain
    if (!psId) {
      const { data: matches } = await supabase.from('problem_statements').select('id').ilike('title', problemName).eq('domain', domain).limit(1);
      psId = matches?.[0]?.id;
    }

    if (!psId) {
      return new Response(JSON.stringify({ error: "Missing psId in request and no matching problem found" }), { status: 400, headers: corsHeaders });
    }

    // Call the DB-side atomic function which locks row FOR UPDATE and updates both tables
    const { data: rpcData, error: rpcError } = await supabase.rpc("select_problem_atomic", {
      p_team_id: teamId,
      p_ps_id: psId,
      p_domain: domain,
      p_problem_name: problemName,
      p_problem_description: problemDescription ?? null,
      p_requester_email: user.email,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      const msg = rpcError.message || rpcError.details || "RPC invocation failed";
      return new Response(JSON.stringify({ error: msg, rpc: rpcError }), { status: 500, headers: corsHeaders });
    }

    // rpcData may come back as a plain object or an array depending on the RPC return shape.
    // Normalize to inspect for error keys emitted by the PL/pgSQL function.
    let normalized: any = rpcData;
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      normalized = rpcData[0];
    }

    if (normalized && normalized.error) {
      const errMsg = normalized.error;
      const status = errMsg === "no_seats" || errMsg === "ps_not_found" ? 409 : 400;
      console.warn("RPC returned error object:", normalized);
      return new Response(JSON.stringify({ error: errMsg, rpc: normalized }), { status, headers: corsHeaders });
    }

    // Return rpc result for debugging/confirmation
    return new Response(JSON.stringify({ success: true, rpc: normalized }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("select-problem error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
