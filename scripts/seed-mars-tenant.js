#!/usr/bin/env node

/**
 * Seed Mars Tenant Owner User
 *
 * This script creates or updates the mars tenant owner for the Open People
 * internal workspace at mars.openpeople.ai.
 *
 * Usage:
 *   node scripts/seed-mars-tenant.js
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   - Supabase project set up
 *   - The 20260119210000_seed_mars_tenant.sql migration has been run
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('💡 To set these up:');
  console.error('   1. Copy .env.local to your project root');
  console.error('   2. Get values from Supabase Dashboard > Settings > API');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedMarsTenant() {
  const email = 'mars@tomlane.space';
  const password = 'opendeck'; // This should be changed after first login
  const fullName = 'mars';
  const ownerRole = 'owner';

  try {
    console.log('🚀 Setting up mars tenant owner...');

    // 1. Ensure the mars tenant exists
    console.log('📋 Checking for mars tenant...');
    let { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', 'mars')
      .single();

    if (tenantError || !tenant) {
      console.log('📝 Mars tenant not found, creating...');
      const { data: newTenant, error: createError } = await supabase
        .from('tenants')
        .insert({
          name: 'Open People',
          slug: 'mars',
          status: 'active',
          settings: {
            features: {
              admin: true,
              storage: true,
              notifications: true,
              email: true,
              vault: true,
              notes: true,
              ai_chat: true,
              knowledge: true,
              api_keys: true,
              workflows: true,
              experiments: true,
              ai_inventory: true,
              ai_analytics: true
            },
            theme: {
              brand_name: 'Open People',
              colors: {
                primary: '#CCFF00',
                accent: '#00D4FF'
              }
            },
            type: 'internal'
          }
        })
        .select()
        .single();

      if (createError || !newTenant) {
        throw new Error(`Failed to create tenant: ${createError?.message}`);
      }
      tenant = newTenant;
      console.log('✅ Mars tenant created');
    } else {
      console.log('✅ Mars tenant exists:', tenant.name);
    }

    const tenantId = tenant.id;

    // 2. Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId;

    if (existingUser) {
      console.log('✅ User already exists, updating profile...');
      userId = existingUser.id;
    } else {
      // Create new user
      console.log('📝 Creating new user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (authError || !authData.user) {
        throw new Error(`Failed to create user: ${authError?.message}`);
      }

      userId = authData.user.id;
      console.log('✅ User created successfully');
    }

    // 3. Check if profile exists - use service role to bypass RLS
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, role, tenant_id')
      .eq('id', userId)
      .single();

    console.log('   Existing profile check:', existingProfile ? 'Found' : 'Not found', profileCheckError?.message || '');

    if (existingProfile) {
      // Update existing profile - use upsert to handle RLS
      console.log('📝 Updating existing profile...');
      console.log('   Current role:', existingProfile.role);
      console.log('   Current tenant_id:', existingProfile.tenant_id);
      console.log('   Target tenant_id:', tenantId);
      
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          role: ownerRole,
          full_name: fullName,
          email: email,
          tenant_id: tenantId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('   Update error:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log('   Updated profile:', updateData);
      console.log('✅ Profile updated to tenant owner');
    } else {
      // Create new profile
      console.log('📝 Creating new profile...');
      const { data: insertData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: ownerRole,
          full_name: fullName,
          email: email,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (profileError) {
        console.error('   Insert error:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('   Created profile:', insertData);
      console.log('✅ Tenant owner profile created');
    }

    // 4. Ensure tenant_billing exists
    const { data: existingBilling } = await supabase
      .from('tenant_billing')
      .select('id')
      .eq('tenant_id', tenantId)
      .single();

    if (!existingBilling) {
      console.log('📝 Creating tenant billing record...');
      await supabase
        .from('tenant_billing')
        .insert({
          tenant_id: tenantId,
          plan: 'enterprise',
          status: 'active',
          plan_limits: {
            ai_calls_per_month: 100000,
            storage_gb: 500,
            team_members: 100
          }
        });
      console.log('✅ Tenant billing created');
    }

    // 5. Verify the setup
    const { data: verification } = await supabase
      .from('profiles')
      .select('role, full_name, tenant_id')
      .eq('id', userId)
      .single();

    const { data: tenantVerify } = await supabase
      .from('tenants')
      .select('name, slug')
      .eq('id', verification?.tenant_id)
      .single();

    console.log('\n🎉 Mars tenant setup complete!');
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${verification?.role}`);
    console.log(`   Name: ${verification?.full_name}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Tenant: ${tenantVerify?.name} (${tenantVerify?.slug})`);
    console.log(`   Tenant ID: ${tenantId}`);

    if (!existingUser) {
      console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
      console.log(`   Temporary password: ${password}`);
    }

    console.log('\n🔗 Tenant owner can access:');
    console.log('   - mars.openpeople.ai (or mars.localhost in development)');
    console.log('   - Tenant workspace with all enabled features');

  } catch (error) {
    console.error('❌ Error seeding mars tenant:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedMarsTenant();
