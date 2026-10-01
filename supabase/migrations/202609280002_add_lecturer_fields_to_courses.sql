ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS lecturer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lecturer_name text;

CREATE INDEX IF NOT EXISTS idx_courses_lecturer_id
  ON public.courses (lecturer_id);

CREATE INDEX IF NOT EXISTS idx_courses_lecturer_name
  ON public.courses (lecturer_name);
