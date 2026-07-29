-- Migration: Add title column to settings

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
