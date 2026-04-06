-- Creator payouts, ledger, and creator columns for AutoCard.
-- Run in Supabase SQL editor if not already applied.

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS total_paid_out numeric NOT NULL DEFAULT 0;

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS flag_1099k boolean NOT NULL DEFAULT false;

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS payout_stripe_account_id text;

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.creators (id) ON DELETE SET NULL,
  total_amount numeric NOT NULL,
  orders_count int NOT NULL DEFAULT 0,
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'paid',
  period_start date,
  period_end date,
  paid_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_creator_id_idx ON public.payouts (creator_id);
CREATE INDEX IF NOT EXISTS payouts_paid_at_idx ON public.payouts (paid_at DESC);
CREATE INDEX IF NOT EXISTS payouts_period_start_idx ON public.payouts (period_start);

CREATE TABLE IF NOT EXISTS public.creator_earnings_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators (id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'eligible',
  eligible_after timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_earnings_ledger_eligible_idx
  ON public.creator_earnings_ledger (status, eligible_after);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings_ledger ENABLE ROW LEVEL SECURITY;
