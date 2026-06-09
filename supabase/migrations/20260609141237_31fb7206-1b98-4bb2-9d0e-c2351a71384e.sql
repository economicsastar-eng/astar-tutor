
-- ============== PROFILES: extend ==============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS year_group text NOT NULL DEFAULT 'Year 13',
  ADD COLUMN IF NOT EXISTS target_grade text NOT NULL DEFAULT 'A*',
  ADD COLUMN IF NOT EXISTS confidence_level text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_target int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS exam_date date,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_key
  ON public.profiles (phone_number) WHERE phone_number IS NOT NULL;

-- Update the existing handle_new_user trigger function to also store phone_number, year_group
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, exam_board, phone_number, year_group)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'exam_board', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'year_group', 'Year 13')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- ============== Shared updated_at trigger ==============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============== SECTIONS (course content) ==============
CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_number int NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read sections" ON public.sections FOR SELECT TO authenticated USING (true);

-- ============== LESSONS ==============
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  spec_reference text NOT NULL DEFAULT '',
  estimated_minutes int NOT NULL DEFAULT 15,
  sort_order int NOT NULL,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);

-- ============== LESSON BLOCKS ==============
CREATE TABLE IF NOT EXISTS public.lesson_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  block_type text NOT NULL CHECK (block_type IN ('content','question','summary')),
  sort_order int NOT NULL,
  content_markdown text,
  summary_points jsonb,
  key_terms jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lesson_blocks TO authenticated;
GRANT ALL ON public.lesson_blocks TO service_role;
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read lesson_blocks" ON public.lesson_blocks FOR SELECT TO authenticated USING (true);

-- ============== QUIZ QUESTIONS ==============
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  lesson_block_id uuid REFERENCES public.lesson_blocks(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option char(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  explanation text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read quiz_questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);

-- ============== QUIZ ATTEMPTS ==============
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  selected_option char(1) NOT NULL CHECK (selected_option IN ('A','B','C','D')),
  is_correct boolean NOT NULL,
  context text NOT NULL DEFAULT 'lesson' CHECK (context IN ('lesson','review','test_out','diagnostic')),
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON public.quiz_attempts (user_id, attempted_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quiz_attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== LESSON PROGRESS ==============
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  current_block_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lesson_progress" ON public.lesson_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_lesson_progress_updated BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== LESSON COMPLETIONS ==============
CREATE TABLE IF NOT EXISTS public.lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  score_percent int NOT NULL DEFAULT 0,
  via_test_out boolean NOT NULL DEFAULT false,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_completions TO authenticated;
GRANT ALL ON public.lesson_completions TO service_role;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lesson_completions" ON public.lesson_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== REVIEW QUEUE ==============
CREATE TABLE IF NOT EXISTS public.review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  correct_streak int NOT NULL DEFAULT 0,
  next_review_date date NOT NULL DEFAULT CURRENT_DATE,
  is_mastered boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
CREATE INDEX IF NOT EXISTS review_queue_due_idx ON public.review_queue (user_id, next_review_date) WHERE is_mastered = false;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_queue TO authenticated;
GRANT ALL ON public.review_queue TO service_role;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review_queue" ON public.review_queue FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_review_queue_updated BEFORE UPDATE ON public.review_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== ESSAY SUBMISSIONS ==============
CREATE TABLE IF NOT EXISTS public.essay_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  exam_board text NOT NULL,
  question_type text NOT NULL,
  mark_allocation int NOT NULL,
  essay_text text NOT NULL,
  mark_awarded int,
  max_mark int,
  feedback_json jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS essay_submissions_user_idx ON public.essay_submissions (user_id, submitted_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.essay_submissions TO authenticated;
GRANT ALL ON public.essay_submissions TO service_role;
ALTER TABLE public.essay_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own essay_submissions" ON public.essay_submissions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== TUTOR CONVERSATIONS ==============
CREATE TABLE IF NOT EXISTS public.tutor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tutor_conversations_user_idx ON public.tutor_conversations (user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_conversations TO authenticated;
GRANT ALL ON public.tutor_conversations TO service_role;
ALTER TABLE public.tutor_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tutor_conversations" ON public.tutor_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_tutor_conv_updated BEFORE UPDATE ON public.tutor_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== USER ACTIVITY ==============
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  lessons_completed int NOT NULL DEFAULT 0,
  questions_answered int NOT NULL DEFAULT 0,
  UNIQUE (user_id, activity_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own user_activity" ON public.user_activity FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== TEST OUT ATTEMPTS ==============
CREATE TABLE IF NOT EXISTS public.test_out_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  score int NOT NULL,
  total int NOT NULL,
  passed boolean NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_out_attempts TO authenticated;
GRANT ALL ON public.test_out_attempts TO service_role;
ALTER TABLE public.test_out_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own test_out_attempts" ON public.test_out_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== DIAGNOSTIC RESULTS ==============
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  results jsonb NOT NULL,
  strongest_theme int,
  weakest_theme int,
  completed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_results TO authenticated;
GRANT ALL ON public.diagnostic_results TO service_role;
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own diagnostic_results" ON public.diagnostic_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== SEED sections + first lessons ==============
INSERT INTO public.sections (theme_number, title, description, sort_order) VALUES
  (1, 'Markets and Market Failure', 'Microeconomic theory — demand, supply, market failure, government intervention', 1),
  (2, 'The National Economy', 'Macroeconomic performance and policy', 2),
  (3, 'Business Behaviour & The Labour Market', 'Firm behaviour, market structures, labour markets', 3),
  (4, 'A Global Perspective', 'International economics, trade, development', 4)
ON CONFLICT (theme_number) DO NOTHING;

INSERT INTO public.lessons (section_id, title, slug, spec_reference, estimated_minutes, sort_order, is_free)
SELECT s.id, v.title, v.slug, v.spec_reference, v.estimated_minutes, v.sort_order, v.is_free
FROM public.sections s
JOIN (VALUES
  (1, 'The Economic Problem', 'economic-problem', '3.1.1.1', 15, 1, true),
  (1, 'Determinants of Demand', 'determinants-of-demand', '3.1.2.1', 20, 2, true),
  (1, 'Determinants of Supply', 'determinants-of-supply', '3.1.3.1', 15, 3, true),
  (1, 'Price Elasticity of Demand', 'price-elasticity-of-demand', '3.1.2.3', 25, 4, true),
  (1, 'Market Failure and Externalities', 'market-failure-externalities', '3.1.5.1', 20, 5, true),
  (2, 'Measures of Economic Performance', 'measures-economic-performance', '3.2.1.1', 15, 1, false),
  (2, 'Aggregate Demand', 'aggregate-demand', '3.2.2.1', 20, 2, false)
) AS v(theme_number, title, slug, spec_reference, estimated_minutes, sort_order, is_free)
  ON s.theme_number = v.theme_number
ON CONFLICT (slug) DO NOTHING;
