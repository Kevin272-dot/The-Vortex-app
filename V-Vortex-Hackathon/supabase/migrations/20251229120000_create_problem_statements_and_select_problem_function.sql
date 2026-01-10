-- Create table for problem statements and an atomic selection function

BEGIN;

CREATE TABLE IF NOT EXISTS public.problem_statements (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  code TEXT,
  title TEXT,
  description TEXT,
  total_seats INT NOT NULL DEFAULT 10,
  seats_booked INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Optional initial seed data to match frontend IDs (adjust counts as needed)
INSERT INTO public.problem_statements (id, domain, code, title, description, total_seats, seats_booked)
VALUES
  ('ps1', 'ai', 'PS 1', 'AI-Generated Image Authenticity Detection', 'Design a system that determines whether an image is AI-generated or real...', 10, 0),
  ('ps2', 'ai', 'PS 2', 'AI-Powered Mind Map Search Engine', 'Design a search system that retrieves information for a user query...', 10, 0),
  ('ps3', 'ai', 'PS 3', 'AI-Powered Mental Well-Being Risk Indicator (Non-Clinical)', 'Design a non-clinical system that analyzes anonymized behavioral patterns...', 10, 0),
  ('fintech1', 'fintech', 'PS 1', 'Unified Payment Orchestration & Automated Settlements', 'Design and prototype a unified payment orchestration platform...', 10, 0),
  ('fintech2', 'fintech', 'PS 2', 'Privacy-Preserving Collaborative Fraud Intelligence Platform', 'Design and prototype a real-time transaction monitoring...', 10, 0),
  ('fintech3', 'fintech', 'PS 3', 'Adaptive Pricing in Real-Time Digital Marketplaces', 'Design a real-time adaptive pricing system...', 10, 0),
  ('cybersecurity1', 'cybersecurity', 'PS 1', 'Secure Identity & Authentication', 'Design a privacy-preserving identity framework...', 10, 0),
  ('cybersecurity2', 'cybersecurity', 'PS 2', 'Automated Vulnerability Detection', 'Create a system that detects software and infrastructure vulnerabilities...', 10, 0),
  ('cybersecurity3', 'cybersecurity', 'PS 3', 'Resilient Network Defense Architecture', 'Design defensive architectures and rapid incident response tooling...', 10, 0),
  ('healthcare1', 'healthcare', 'PS 1', 'AI-Powered Early Disease Detection System', 'Create an intelligent diagnostic system...', 10, 0),
  ('healthcare2', 'healthcare', 'PS 2', 'Telemedicine Platform with Remote Monitoring', 'Design a comprehensive telemedicine platform...', 10, 0),
  ('healthcare3', 'healthcare', 'PS 3', 'Medical Supply Chain Transparency System', 'Develop a blockchain-enabled supply chain tracking system...', 10, 0),
  ('iot1', 'iot', 'PS 1', 'Sky-Glow Sentinel (Urban Light Pollution Mapping)', 'Design a high-sensitivity Sky Quality Monitoring system...', 10, 0),
  ('iot2', 'iot', 'PS 2', 'Decentralized Communication in Infrastructure-Denied Environments', 'Develop a decentralized, peer-to-peer hardware communication network...', 10, 0),
  ('iot3', 'iot', 'PS 3', 'Smart Parking Occupancy Detection System', 'Design a low-cost IoT-based system that detects parking spot occupancy...', 10, 0),
  ('cybersecurity4', 'cybersecurity', 'PS 4', 'Autonomous Threat Hunting & Response', 'Design an autonomous security system that proactively hunts for threats, analyzes attack patterns, and implements automated response mechanisms to neutralize cyber threats in real-time.', 10, 0)
ON CONFLICT (id) DO NOTHING;

-- Atomic selection function: verifies team lead, checks/locks seats, updates both tables in one transaction
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
  lead_email text;
  existing_problem text;
  seats_left int;
BEGIN
  SELECT t.lead_email, t.problem_statement
    INTO lead_email, existing_problem
    FROM public.teams t
   WHERE t.id = p_team_id;
  IF lead_email IS NULL THEN
    RETURN jsonb_build_object('error','team_not_found');
  END IF;
  IF lower(lead_email) != lower(coalesce(p_requester_email,'')) THEN
    RETURN jsonb_build_object('error','not_lead');
  END IF;
  IF existing_problem IS NOT NULL THEN
    RETURN jsonb_build_object('error','already_assigned');
  END IF;

  -- Lock the problem row to prevent concurrent seat changes
  PERFORM 1 FROM public.problem_statements WHERE id = p_ps_id FOR UPDATE;

  SELECT total_seats - seats_booked INTO seats_left FROM public.problem_statements WHERE id = p_ps_id;
  IF seats_left IS NULL THEN
    RETURN jsonb_build_object('error','ps_not_found');
  END IF;
  IF seats_left <= 0 THEN
    RETURN jsonb_build_object('error','no_seats');
  END IF;

  UPDATE public.problem_statements SET seats_booked = seats_booked + 1 WHERE id = p_ps_id;

  UPDATE public.teams
  SET domain = p_domain,
      problem_statement = p_problem_name,
      problem_description = p_problem_description
  WHERE id = p_team_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

COMMIT;
