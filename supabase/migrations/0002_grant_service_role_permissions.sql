-- Migration: Grant service_role access to booking tables

GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO service_role;
