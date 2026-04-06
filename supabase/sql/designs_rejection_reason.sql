-- Stores admin rejection reason for creator visibility (creator designs page).
ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS rejection_reason text;
