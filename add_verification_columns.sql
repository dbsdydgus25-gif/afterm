-- Add verification status columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'idle', -- idle, report_received, verifying_1, verifying_2, unlocked
ADD COLUMN IF NOT EXISTS report_received_at timestamptz,
ADD COLUMN IF NOT EXISTS last_verification_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS verify_attempt_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS unlock_code text; -- For SMS verification later

-- Index for faster cron queries
CREATE INDEX IF NOT EXISTS idx_messages_verification_status ON messages(verification_status);
