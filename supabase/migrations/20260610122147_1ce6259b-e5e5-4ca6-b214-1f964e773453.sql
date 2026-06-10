ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exam_date date,
  ADD COLUMN IF NOT EXISTS target_grade text,
  ADD COLUMN IF NOT EXISTS weekly_hours text,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;