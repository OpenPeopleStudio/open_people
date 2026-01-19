import { supabase } from './supabaseClient'

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string, tenantId?: string) {
  let query = supabase
    .from('709_profiles')
    .select('*')
    .eq('id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: profile } = await query.single()

  return profile
}