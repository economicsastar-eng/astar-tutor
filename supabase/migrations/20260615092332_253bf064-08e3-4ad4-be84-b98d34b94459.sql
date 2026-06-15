
CREATE OR REPLACE FUNCTION public.can_access_quiz_question(_user_id uuid, _question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM quiz_questions q
    JOIN lessons l ON l.id = q.lesson_id
    WHERE q.id = _question_id
      AND (
        l.is_free = true
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = _user_id
            AND p.plan IS NOT NULL
            AND p.plan <> 'free'
            AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
        )
      )
  );
$$;

DROP POLICY IF EXISTS "Users manage own quiz_attempts" ON public.quiz_attempts;

CREATE POLICY "Users select own quiz_attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own quiz_attempts with access"
ON public.quiz_attempts FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.can_access_quiz_question(auth.uid(), question_id)
);

CREATE POLICY "Users update own quiz_attempts with access"
ON public.quiz_attempts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND public.can_access_quiz_question(auth.uid(), question_id)
);

CREATE POLICY "Users delete own quiz_attempts"
ON public.quiz_attempts FOR DELETE
USING (auth.uid() = user_id);
