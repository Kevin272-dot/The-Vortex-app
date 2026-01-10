-- Replace select_problem_atomic with unambiguous, row-locked implementation

CREATE OR REPLACE FUNCTION public.select_problem_atomic(
  p_team_id uuid,
  p_ps_id text,
  p_domain text,
  p_problem_name text,
  p_problem_description text,
  p_requester_email text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_lead_email text;
  v_existing_problem text;
  v_seats_left int;
BEGIN
  -- Read team info with explicit aliasing
  SELECT t.lead_email, t.problem_statement
    INTO v_lead_email, v_existing_problem
    FROM public.teams t
   WHERE t.id = p_team_id;

  IF v_lead_email IS NULL THEN
    RETURN jsonb_build_object('error','team_not_found');
  END IF;

  IF lower(v_lead_email) != lower(coalesce(p_requester_email,'')) THEN
    RETURN jsonb_build_object('error','not_lead');
  END IF;

  IF v_existing_problem IS NOT NULL THEN
    RETURN jsonb_build_object('error','already_assigned');
  END IF;

  -- Lock the chosen problem statement row and compute seats left in one statement
  SELECT (ps.total_seats - ps.seats_booked)
    INTO v_seats_left
    FROM public.problem_statements ps
   WHERE ps.id = p_ps_id
   FOR UPDATE;

  IF v_seats_left IS NULL THEN
    RETURN jsonb_build_object('error','ps_not_found');
  END IF;

  IF v_seats_left <= 0 THEN
    RETURN jsonb_build_object('error','no_seats');
  END IF;

  -- Increment booked seats
  UPDATE public.problem_statements
     SET seats_booked = seats_booked + 1
   WHERE id = p_ps_id;

  -- Update team assignment
  UPDATE public.teams t
     SET domain = p_domain,
         problem_statement = p_problem_name,
         problem_description = p_problem_description
   WHERE t.id = p_team_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
