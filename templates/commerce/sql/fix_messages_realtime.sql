-- Fix Messages: Enable Realtime and Verify Setup
-- Run this in Supabase SQL Editor

-- 1. Enable realtime publication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Verify messages table is in realtime publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 3. Check current RLS policies on messages
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- 4. Verify tenant setup
SELECT id, name, slug, status 
FROM tenants 
ORDER BY created_at;

-- 5. Check for messages without tenant_id (data integrity issue)
SELECT COUNT(*) as messages_without_tenant
FROM messages 
WHERE tenant_id IS NULL;

-- 6. Check for profiles without public_key (encryption not initialized)
SELECT 
  id,
  role,
  full_name,
  CASE 
    WHEN public_key IS NOT NULL THEN 'Has Key'
    ELSE 'No Key'
  END as encryption_status,
  public_key_updated_at
FROM "709_profiles"
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check recent messages and their encryption status
SELECT 
  m.id,
  m.customer_id,
  m.sender_type,
  m.encrypted,
  CASE 
    WHEN m.sender_public_key IS NOT NULL THEN 'Has Sender Key'
    ELSE 'No Sender Key'
  END as sender_key_status,
  m.tenant_id,
  m.created_at,
  LEFT(m.content, 50) as content_preview
FROM messages m
ORDER BY m.created_at DESC
LIMIT 10;

-- 8. Fix: Ensure all messages have tenant_id (if any are NULL)
-- Uncomment and run if you find NULL tenant_ids above
-- UPDATE messages 
-- SET tenant_id = (SELECT id FROM tenants WHERE slug = '709exclusive' LIMIT 1)
-- WHERE tenant_id IS NULL;

-- 9. Grant necessary permissions for realtime
-- This ensures authenticated users can subscribe to changes
GRANT SELECT ON messages TO authenticated;
GRANT INSERT ON messages TO authenticated;
GRANT UPDATE ON messages TO authenticated;
