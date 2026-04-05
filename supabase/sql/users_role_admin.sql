-- Role column for buyer vs admin (used by /admin routes).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'buyer';

-- Verify this id exists in public.users before running.
UPDATE public.users
SET role = 'admin'
WHERE id = 'f8f6f452-cba0-4910-86d1-1bc9e985fe6d';
