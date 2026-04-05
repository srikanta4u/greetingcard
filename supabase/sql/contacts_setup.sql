-- Contacts + contact_events schema expected by app/api/contacts and dashboard.
-- Inspect existing columns first:
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'contacts'
--   ORDER BY ordinal_position;

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- If the table already existed with fewer columns, add missing ones:
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS relationship text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON public.contacts (user_id);
CREATE INDEX IF NOT EXISTS contacts_deleted_at_idx ON public.contacts (deleted_at);

-- ---------------------------------------------------------------------------
-- contact_events (POST /api/contacts/[id]/events)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  recurs_annually boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_events ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts (id) ON DELETE CASCADE;
ALTER TABLE public.contact_events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE public.contact_events ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE public.contact_events ADD COLUMN IF NOT EXISTS recurs_annually boolean DEFAULT false;
ALTER TABLE public.contact_events ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS contact_events_contact_id_idx ON public.contact_events (contact_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (common cause of "Could not create contact" with no column error)
-- ---------------------------------------------------------------------------
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_own" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert_own" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update_own" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete_own" ON public.contacts;

CREATE POLICY "contacts_select_own"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert_own"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update_own"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_delete_own"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contact_events_select_own" ON public.contact_events;
DROP POLICY IF EXISTS "contact_events_insert_own" ON public.contact_events;
DROP POLICY IF EXISTS "contact_events_update_own" ON public.contact_events;
DROP POLICY IF EXISTS "contact_events_delete_own" ON public.contact_events;

CREATE POLICY "contact_events_select_own"
  ON public.contact_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "contact_events_insert_own"
  ON public.contact_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "contact_events_update_own"
  ON public.contact_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "contact_events_delete_own"
  ON public.contact_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  );
