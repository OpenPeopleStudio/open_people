-- Optional: Clean up old encrypted messages without sender_public_key
-- These messages can't be decrypted and cause console errors
-- Only run this if you want to remove old broken encrypted messages

-- 1. Find messages that claim to be encrypted but are missing required fields
SELECT 
  id,
  customer_id,
  sender_type,
  encrypted,
  CASE WHEN sender_public_key IS NOT NULL THEN 'Has Key' ELSE 'Missing Key' END as sender_key_status,
  CASE WHEN iv IS NOT NULL THEN 'Has IV' ELSE 'Missing IV' END as iv_status,
  created_at
FROM messages
WHERE encrypted = true
  AND (sender_public_key IS NULL OR iv IS NULL)
ORDER BY created_at DESC
LIMIT 20;

-- 2. (OPTIONAL) Mark these broken encrypted messages as unencrypted
-- This will stop decryption attempts and show them as plaintext
-- UNCOMMENT to run:

-- UPDATE messages
-- SET 
--   encrypted = false,
--   iv = NULL,
--   sender_public_key = NULL,
--   message_index = 0
-- WHERE encrypted = true
--   AND (sender_public_key IS NULL OR iv IS NULL);

-- 3. (OPTIONAL) Delete these broken messages entirely
-- ONLY use this if you're sure you don't need them
-- UNCOMMENT to run:

-- DELETE FROM messages
-- WHERE encrypted = true
--   AND (sender_public_key IS NULL OR iv IS NULL);

-- 4. Verify cleanup worked
-- Should return 0 rows after cleanup:

SELECT COUNT(*) as broken_encrypted_messages
FROM messages
WHERE encrypted = true
  AND (sender_public_key IS NULL OR iv IS NULL);
