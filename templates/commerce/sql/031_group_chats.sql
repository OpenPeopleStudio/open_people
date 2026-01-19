-- =============================================================================
-- Staff messaging updates + group chats
-- =============================================================================

-- Allow staff to view/send/update admin messages
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Admins can send messages" ON messages;
CREATE POLICY "Admins can send messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
  )
  AND sender_type = 'admin'
);

DROP POLICY IF EXISTS "Admins can update messages" ON messages;
CREATE POLICY "Admins can update messages"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
  )
);

-- =============================================================================
-- Group chat tables (staff/admin/owner only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  type text NOT NULL CHECK (type IN ('direct', 'group')),
  title text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_members (
  thread_id uuid REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant_id ON chat_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_thread_id ON chat_members(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Members can see threads they belong to
DROP POLICY IF EXISTS "Chat members can view threads" ON chat_threads;
CREATE POLICY "Chat members can view threads"
ON chat_threads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_members
    WHERE chat_members.thread_id = chat_threads.id
    AND chat_members.user_id = auth.uid()
  )
);

-- Staff/admin/owner can create threads for their tenant
DROP POLICY IF EXISTS "Staff can create chat threads" ON chat_threads;
CREATE POLICY "Staff can create chat threads"
ON chat_threads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
    AND tenant_id = chat_threads.tenant_id
  )
);

-- Members can view other members in their threads
DROP POLICY IF EXISTS "Chat members can view members" ON chat_members;
CREATE POLICY "Chat members can view members"
ON chat_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_members AS cm
    WHERE cm.thread_id = chat_members.thread_id
    AND cm.user_id = auth.uid()
  )
);

-- Staff/admin/owner can add members for their tenant
DROP POLICY IF EXISTS "Staff can add chat members" ON chat_members;
CREATE POLICY "Staff can add chat members"
ON chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles" AS actor
    WHERE actor.id = auth.uid()
    AND actor.role IN ('staff', 'admin', 'owner')
  )
  AND EXISTS (
    SELECT 1 FROM chat_threads
    WHERE chat_threads.id = chat_members.thread_id
    AND chat_threads.tenant_id = (
      SELECT tenant_id FROM "709_profiles" WHERE id = auth.uid()
    )
  )
  AND EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = chat_members.user_id
    AND tenant_id = (
      SELECT tenant_id FROM "709_profiles" WHERE id = auth.uid()
    )
    AND role IN ('staff', 'admin', 'owner')
  )
);

-- Members can read messages in their threads
DROP POLICY IF EXISTS "Chat members can view messages" ON chat_messages;
CREATE POLICY "Chat members can view messages"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_members
    WHERE chat_members.thread_id = chat_messages.thread_id
    AND chat_members.user_id = auth.uid()
  )
);

-- Members can send messages in their threads
DROP POLICY IF EXISTS "Chat members can send messages" ON chat_messages;
CREATE POLICY "Chat members can send messages"
ON chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM chat_members
    WHERE chat_members.thread_id = chat_messages.thread_id
    AND chat_members.user_id = auth.uid()
  )
);

-- Enable realtime for group chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
