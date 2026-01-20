-- ═══════════════════════════════════════════════════════════════════════════
-- Fix RLS policies for AI-related tables
-- 
-- Issue: These tables only had owner-only policies (user_id = auth.uid())
-- which blocked super_admin users and didn't have service role bypass.
--
-- Solution: Add service role bypass to all AI tables so the server can
-- create/read records on behalf of authenticated users.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ai_user_profiles
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing policy and recreate with proper checks
DROP POLICY IF EXISTS "ai_user_profiles_owner" ON ai_user_profiles;

-- Users can manage their own profiles
CREATE POLICY "ai_user_profiles_owner" ON ai_user_profiles
  FOR ALL USING (user_id = auth.uid());

-- Service role bypass (for server-side operations)
DROP POLICY IF EXISTS "ai_user_profiles_service" ON ai_user_profiles;
CREATE POLICY "ai_user_profiles_service" ON ai_user_profiles
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- ai_profile_reflections
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ai_profile_reflections_owner" ON ai_profile_reflections;

CREATE POLICY "ai_profile_reflections_owner" ON ai_profile_reflections
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_profile_reflections_service" ON ai_profile_reflections;
CREATE POLICY "ai_profile_reflections_service" ON ai_profile_reflections
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- ai_user_goals
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ai_user_goals_owner" ON ai_user_goals;

CREATE POLICY "ai_user_goals_owner" ON ai_user_goals
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_user_goals_service" ON ai_user_goals;
CREATE POLICY "ai_user_goals_service" ON ai_user_goals
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- ai_conversation_styles
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ai_conversation_styles_access" ON ai_conversation_styles;
DROP POLICY IF EXISTS "ai_conversation_styles_owner" ON ai_conversation_styles;
DROP POLICY IF EXISTS "ai_conversation_styles_select" ON ai_conversation_styles;

-- Users can read their own styles + system styles (NULL user_id)
CREATE POLICY "ai_conversation_styles_select" ON ai_conversation_styles
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can manage their own styles
CREATE POLICY "ai_conversation_styles_owner" ON ai_conversation_styles
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_conversation_styles_service" ON ai_conversation_styles;
CREATE POLICY "ai_conversation_styles_service" ON ai_conversation_styles
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- user_ai_settings
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "user_ai_settings_owner" ON user_ai_settings;

CREATE POLICY "user_ai_settings_owner" ON user_ai_settings
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_ai_settings_service" ON user_ai_settings;
CREATE POLICY "user_ai_settings_service" ON user_ai_settings
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- ai_conversations
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ai_conversations_owner" ON ai_conversations;

CREATE POLICY "ai_conversations_owner" ON ai_conversations
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "ai_conversations_service" ON ai_conversations;
CREATE POLICY "ai_conversations_service" ON ai_conversations
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- ai_messages
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ai_messages_owner" ON ai_messages;

-- Users can access messages in their conversations
CREATE POLICY "ai_messages_owner" ON ai_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ai_messages_service" ON ai_messages;
CREATE POLICY "ai_messages_service" ON ai_messages
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- ai_memories
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ai_memories_owner" ON ai_memories;

CREATE POLICY "ai_memories_owner" ON ai_memories
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "ai_memories_service" ON ai_memories;
CREATE POLICY "ai_memories_service" ON ai_memories
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
