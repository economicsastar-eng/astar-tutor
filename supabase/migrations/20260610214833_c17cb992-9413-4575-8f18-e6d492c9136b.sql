DROP POLICY IF EXISTS "Public can read lesson_blocks" ON public.lesson_blocks;
CREATE POLICY "Anon can read free lesson_blocks"
  ON public.lesson_blocks FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_blocks.lesson_id AND l.is_free = true));

DROP POLICY IF EXISTS "Authenticated read lesson_blocks" ON public.lesson_blocks;
CREATE POLICY "Authenticated read accessible lesson_blocks"
  ON public.lesson_blocks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = lesson_blocks.lesson_id
      AND (
        l.is_free = true
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.plan IS NOT NULL AND p.plan <> 'free'
            AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
        )
      )
  ));

DROP POLICY IF EXISTS "Authenticated read quiz_questions" ON public.quiz_questions;
CREATE POLICY "Authenticated read accessible quiz_questions"
  ON public.quiz_questions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = quiz_questions.lesson_id
      AND (
        l.is_free = true
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.plan IS NOT NULL AND p.plan <> 'free'
            AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
        )
      )
  ));