-- Move iot4 to cybersecurity4

BEGIN;

-- Update the iot4 problem statement to become cybersecurity4
UPDATE public.problem_statements
SET 
  id = 'cybersecurity4',
  domain = 'cybersecurity',
  code = 'PS 4',
  title = 'Autonomous Threat Hunting & Response',
  description = 'Design an autonomous security system that proactively hunts for threats, analyzes attack patterns, and implements automated response mechanisms to neutralize cyber threats in real-time.'
WHERE id = 'iot4';

COMMIT;
