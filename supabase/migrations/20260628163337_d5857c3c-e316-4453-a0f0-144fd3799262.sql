CREATE OR REPLACE FUNCTION public.can_access_quiz_question(_user_id uuid, _question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
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