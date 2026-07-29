-- Migration: Grant service_role access to cars table

GRANT SELECT ON public.cars TO service_role;
