-- 1. Enable Row Level Security (Already enabled, but safe to run again)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid confusion/errors
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- 3. Re-create Policies
-- Select: Users can only see their own messages
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (auth.uid() = user_id);

-- Insert: Users can only insert messages as themselves
CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update: Users can only update their own messages
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (auth.uid() = user_id);

-- Delete: Users can only delete their own messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (auth.uid() = user_id);

-- 4. Add Foreign Key Constraint (Safe Check)
-- We attempt to add the constraint only if it doesn't exist.
-- However, standard SQL doesn't have "ADD CONSTRAINT IF NOT EXISTS".
-- Simple workaround: Drop it first if it might be wrong, or just let it fail if it exists (which is fine).
-- But to be clean, let's try to add it. If it fails providing "already exists" error, that's good.
-- Better approach for Supabase SQL Editor: Just run this. If FK exists, it will error but Policies will be applied.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_user') THEN
        ALTER TABLE messages
        ADD CONSTRAINT fk_messages_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;
