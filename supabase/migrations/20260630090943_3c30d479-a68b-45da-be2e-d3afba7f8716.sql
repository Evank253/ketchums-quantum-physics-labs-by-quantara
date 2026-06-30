REVOKE INSERT ON public.chat_messages FROM authenticated, anon;
GRANT INSERT ON public.chat_messages TO service_role;