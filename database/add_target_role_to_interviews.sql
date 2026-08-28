-- Migration: Add target_role to interviews
-- Description: Preserves the active Target Role of the candidate at the exact moment the interview was created.
-- This ensures that if the candidate later pivots to a new career path, historical practice evidence
-- remains bound to the role it was originally generated and evaluated for.

ALTER TABLE public.interviews 
ADD COLUMN target_role text NULL;

-- Note: Nullability is intentionally set to NULL to preserve backward compatibility 
-- with legacy historical interviews which were generated before the Target Role architecture existed.
