-- Migration: Grant service_role access to users table

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;
