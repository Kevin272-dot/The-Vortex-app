-- Move the 4th IoT problem to Cybersecurity as cybersecurity4

BEGIN;

-- Remove the IoT PS 4 entry if it exists
DELETE FROM public.problem_statements
WHERE id = 'iot4';

-- Upsert the Cybersecurity PS 4 entry
INSERT INTO public.problem_statements (id, domain, code, title, description, total_seats, seats_booked)
VALUES (
  'cybersecurity4',
  'cybersecurity',
  'PS 4',
  'Autonomous Threat Hunting & Response',
  'Design an autonomous security system that proactively hunts for threats, analyzes attack patterns, and implements automated response mechanisms to neutralize cyber threats in real-time.',
  10,
  0
)
ON CONFLICT (id) DO UPDATE SET
  domain = EXCLUDED.domain,
  code = EXCLUDED.code,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_seats = EXCLUDED.total_seats,
  seats_booked = LEAST(public.problem_statements.seats_booked, EXCLUDED.total_seats);

COMMIT;
