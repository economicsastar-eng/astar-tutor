
CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_ref text NOT NULL,
  theme_number integer NOT NULL CHECK (theme_number BETWEEN 1 AND 4),
  topic_name text NOT NULL,
  subtopic_name text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  real_world_example text,
  card_type text NOT NULL CHECK (card_type IN ('definition','mechanism','evaluation')),
  difficulty_base integer NOT NULL CHECK (difficulty_base BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read flashcards"
  ON public.flashcards FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX flashcards_spec_ref_idx ON public.flashcards(spec_ref);
CREATE INDEX flashcards_theme_idx ON public.flashcards(theme_number);

CREATE TABLE public.flashcard_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  ease_factor double precision NOT NULL DEFAULT 2.5,
  interval_days double precision NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  next_due_at timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  last_rating text CHECK (last_rating IN ('again','hard','good','easy')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_progress TO authenticated;
GRANT ALL ON public.flashcard_progress TO service_role;

ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flashcard progress"
  ON public.flashcard_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcard progress"
  ON public.flashcard_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard progress"
  ON public.flashcard_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX flashcard_progress_user_due_idx
  ON public.flashcard_progress(user_id, next_due_at);

CREATE TRIGGER update_flashcard_progress_updated_at
  BEFORE UPDATE ON public.flashcard_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
