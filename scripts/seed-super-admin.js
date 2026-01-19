#!/usr/bin/env node

/**
 * Seed Super Admin User
 *
 * This script creates or updates tom@openpeople.ai as a super admin user
 * for the Open People platform.
 *
 * Usage:
 *   node scripts/seed-super-admin.js
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   - Supabase project set up
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
  console.error('   3. Or run the manual SQL script: seed-super-admin-manual.sql');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedSuperAdmin() {
  const email = 'tom@openpeople.ai';
  const password = 'TempPass123!'; // This should be changed after first login
  const fullName = 'Tom';
  const superAdminRole = 'super_admin';

  try {
    console.log(`🌱 Seeding super admin user: ${email}`);

    // Check if user already exists
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

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('709_profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      console.log('📝 Updating existing profile...');
      const { error: updateError } = await supabase
        .from('709_profiles')
        .update({
          role: superAdminRole,
          full_name: fullName,
          updated_at: new Date().toISOString(),
          tenant_id: null, // Super admin is global
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log('✅ Profile updated to super admin');
    } else {
      // Create new profile
      console.log('📝 Creating new profile...');
      const { error: profileError } = await supabase
        .from('709_profiles')
        .insert({
          id: userId,
          role: superAdminRole,
          full_name: fullName,
          tenant_id: null, // Super admin is global
        });

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('✅ Super admin profile created');
    }

    // Verify the setup
    const { data: verification } = await supabase
      .from('709_profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single();

    console.log('\n🎉 Super admin setup complete!');
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${verification?.role}`);
    console.log(`   Name: ${verification?.full_name}`);
    console.log(`   User ID: ${userId}`);

    if (!existingUser) {
      console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
      console.log(`   Temporary password: ${password}`);
    }

    console.log('\n🔗 Super admin can access:');
    console.log('   - app.openpeople.ai (or app.localhost in development)');
    console.log('   - Platform administration dashboard');

  } catch (error) {
    console.error('❌ Error seeding super admin:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedSuperAdmin();