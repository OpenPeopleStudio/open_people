import { createClient } from '@/lib/supabase/server';
import type { TenantSettings } from '@/types/tenant';

export async function getTenantSettings(): Promise<TenantSettings | null> {
  try {
    const supabase = createClient();

    // Get current tenant from request context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('settings')
      .eq('owner_id', user.id)
      .single();

    if (error || !tenant) {
      console.error('Error fetching tenant settings:', error);
      return null;
    }

    return tenant.settings as TenantSettings;
  } catch (error) {
    console.error('Error in getTenantSettings:', error);
    return null;
  }
}

export async function updateTenantSettings(updates: Partial<TenantSettings>): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('tenants')
      .update({
        settings: updates,
        updated_at: new Date().toISOString()
      })
      .eq('owner_id', user.id);

    if (error) {
      console.error('Error updating tenant settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTenantSettings:', error);
    return false;
  }
}