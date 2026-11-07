ALTER TABLE public.platforms
  ADD COLUMN IF NOT EXISTS donation_settings jsonb;

CREATE TABLE IF NOT EXISTS public.platform_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
  payment_request_id uuid,
  status varchar(20) NOT NULL DEFAULT 'INITIALIZING',
  amount numeric NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'IDR',
  option_title varchar(255) NOT NULL,
  status_token_hash varchar(64) NOT NULL UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_donations_platform_created
  ON public.platform_donations (platform_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_donations_payment_request
  ON public.platform_donations (payment_request_id)
  WHERE payment_request_id IS NOT NULL;
