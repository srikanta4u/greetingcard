-- Tables for scheduled-card processing (Edge Function + /api/cron/process-scheduled).
-- Run in Supabase SQL editor if these do not exist yet.

CREATE TABLE IF NOT EXISTS public.job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  evaluated integer NOT NULL DEFAULT 0,
  dispatched integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  notes text
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  type text NOT NULL,
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS job_logs_run_at_idx ON public.job_logs (run_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);

ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
