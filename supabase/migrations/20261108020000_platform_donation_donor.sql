ALTER TABLE public.platform_donations
  ADD COLUMN IF NOT EXISTS donor_user_id uuid,
  ADD COLUMN IF NOT EXISTS donor_name varchar(255),
  ADD COLUMN IF NOT EXISTS donor_email varchar(320);

CREATE INDEX IF NOT EXISTS idx_platform_donations_platform_status_created
  ON public.platform_donations (platform_id, status, created_at DESC);
