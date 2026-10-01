-- Add course targeting fields used by student course registration.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS level text;

-- Existing courses remain uncategorized until their lecturer sets these values.
