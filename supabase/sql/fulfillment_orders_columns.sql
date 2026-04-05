-- Columns used by print fulfillment (dispatch + print-vendor webhook).
-- Apply in Supabase SQL editor if missing.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS print_job_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier text;

CREATE INDEX IF NOT EXISTS orders_print_job_id_idx ON public.orders (print_job_id)
  WHERE print_job_id IS NOT NULL;
