CREATE TABLE public.otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  failed_attempts int NOT NULL DEFAULT 0,
  used boolean NOT NULL DEFAULT false
);
CREATE INDEX otp_requests_email_idx ON public.otp_requests (email, created_at DESC);
CREATE INDEX otp_requests_ip_idx ON public.otp_requests (ip, created_at DESC);
GRANT ALL ON public.otp_requests TO service_role;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;