-- Refund claims + ledger linkage + shipped_at for creator metrics.
-- Run in Supabase SQL editor if not already applied.

CREATE TABLE IF NOT EXISTS public.refund_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refund_claims_status_idx
  ON public.refund_claims (status);
CREATE INDEX IF NOT EXISTS refund_claims_order_id_idx
  ON public.refund_claims (order_id);
CREATE INDEX IF NOT EXISTS refund_claims_user_id_idx
  ON public.refund_claims (user_id);

ALTER TABLE public.refund_claims ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.creator_earnings_ledger
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL;

ALTER TABLE public.creator_earnings_ledger
  ADD COLUMN IF NOT EXISTS design_id uuid REFERENCES public.designs (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS creator_earnings_ledger_order_id_idx
  ON public.creator_earnings_ledger (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS creator_earnings_ledger_design_id_idx
  ON public.creator_earnings_ledger (design_id)
  WHERE design_id IS NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_shipped_at_idx
  ON public.orders (shipped_at)
  WHERE shipped_at IS NOT NULL;
