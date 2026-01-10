-- Connect existing cybersecurity4 row to the cybersecurity domain (no new row created)
-- If it was still stored as iot4, rename it to cybersecurity4 and move the domain.

BEGIN;

-- If the row exists as iot4, rename it while preserving seats_booked
UPDATE public.problem_statements
SET id = 'cybersecurity4'
WHERE id = 'iot4';

-- Ensure cybersecurity4 is in the right domain with the correct code label
UPDATE public.problem_statements
SET domain = 'cybersecurity',
    code = 'PS 4'
WHERE id = 'cybersecurity4';

COMMIT;
