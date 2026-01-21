-- Create verification_codes table for SMS OTP
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON public.verification_codes(phone);

-- RLS (Optional, but good practice. For now public insert via API is fine as logic is server-side)
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow server (service role) full access
CREATE POLICY "Service role full access" ON public.verification_codes
    USING (true)
    WITH CHECK (true);
