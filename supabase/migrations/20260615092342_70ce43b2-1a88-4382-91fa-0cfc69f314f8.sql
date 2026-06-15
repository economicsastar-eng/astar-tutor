
REVOKE EXECUTE ON FUNCTION public.can_access_quiz_question(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_quiz_question(uuid, uuid) TO authenticated, service_role;
