-- Pending vs approved creator applications (run in Supabase SQL editor).
-- Default true preserves access for existing creator rows when the column is added.

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT true;
