
-- 1) Flashcards: gate paid themes behind active plan
DROP POLICY IF EXISTS "Authenticated users can read flashcards" ON public.flashcards;

CREATE POLICY "Authenticated read accessible flashcards"
ON public.flashcards
FOR SELECT
TO authenticated
USING (
  theme_number = 1
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.plan IS NOT NULL
      AND p.plan <> 'free'
      AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
  )
);

-- 2) Profiles: prevent users from self-upgrading their plan/stripe fields
-- Revoke column-level UPDATE on billing fields from authenticated users.
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Re-grant UPDATE only on non-billing columns
GRANT UPDATE (
  phone_number,
  year_group,
  target_grade,
  confidence_level,
  weekly_hours,
  onboarding_complete,
  name
) ON public.profiles TO authenticated;

-- service_role retains ALL (for server-side plan updates)
GRANT ALL ON public.profiles TO service_role;
