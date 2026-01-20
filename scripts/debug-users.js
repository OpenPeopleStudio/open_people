#!/usr/bin/env node

/**
 * Debug script to check auth users vs profiles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  // List all users
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log('=== Auth Users ===');
  if (users?.users) {
    users.users.forEach(u => {
      console.log('  ', u.id, u.email);
    });
  }

  // List all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role, tenant_id');
  console.log('\n=== Profiles ===');
  if (profiles) {
    profiles.forEach(p => {
      console.log('  ', p.id, p.email, p.role, p.tenant_id);
    });
  }
  if (error) console.log('Error:', error);

  // Check for orphaned profiles (profile exists but no auth user)
  const authIds = new Set(users?.users?.map(u => u.id) || []);
  const orphaned = profiles?.filter(p => authIds.has(p.id) === false) || [];
  if (orphaned.length > 0) {
    console.log('\n=== ORPHANED PROFILES (no matching auth user) ===');
    orphaned.forEach(p => console.log('  ', p.id, p.email));
  }

  // Check for auth users without profiles
  const profileIds = new Set(profiles?.map(p => p.id) || []);
  const noProfile = users?.users?.filter(u => profileIds.has(u.id) === false) || [];
  if (noProfile.length > 0) {
    console.log('\n=== AUTH USERS WITHOUT PROFILE ===');
    noProfile.forEach(u => console.log('  ', u.id, u.email));
  }

  // Get mars tenant
  const { data: marsTenant } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', 'mars')
    .single();
  console.log('\n=== Mars Tenant ===');
  console.log('  ', marsTenant?.id, marsTenant?.name, marsTenant?.slug);
}

debug();
