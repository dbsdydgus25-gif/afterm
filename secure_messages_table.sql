-- 1. Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for Select (Users can only see their own messages)
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create Policy for Insert (Users can only insert messages as themselves)
CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Create Policy for Update (Users can only update their own messages)
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Create Policy for Delete (Users can only delete their own messages)
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (auth.uid() = user_id);

-- 6. Add Foreign Key Constraint (if not exists)
-- Note: 'auth.users' table is in a separate schema, but Supabase allows referencing it.
ALTER TABLE messages
ADD CONSTRAINT fk_messages_user
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;
