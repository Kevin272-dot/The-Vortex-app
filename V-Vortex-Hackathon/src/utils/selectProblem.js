import { supabase } from "../supabaseClient";

export async function selectProblem(payload) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const base = import.meta.env.VITE_SUPABASE_URL || "";
  const fnUrl = base.replace(/\/$/, "") + "/functions/v1/select-problem";
  console.debug("selectProblem: POST", fnUrl, payload);

  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("selectProblem: network error", err);
    throw new Error("Network error while contacting select-problem function");
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    console.warn("selectProblem: response not JSON", e);
  }

  console.debug("selectProblem: response", res.status, data);

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}
