import { supabase } from "../supabaseClient";

export async function buildTeam(payload) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(
    "https://zmcrdozxxclgzpltwpme.supabase.co/functions/v1/build-team",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to build team");
  }

  return data;
}
