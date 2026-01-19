# Open People Scripts

This directory contains utility scripts for managing the Open People platform.

## Super Admin Seeding

### `seed-super-admin.js`

Seeds `tom@openpeople.ai` as a super admin user for the Open People platform.

**What it does:**
- Creates or updates the user `tom@openpeople.ai` in Supabase Auth
- Creates/updates their profile in the `709_profiles` table with `owner` role
- Grants super admin access to the platform

**Usage:**

1. Ensure your environment variables are set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the script:
   ```bash
   node scripts/seed-super-admin.js
   ```

**What happens:**
- If the user doesn't exist, creates them with a temporary password
- Sets up their profile with super admin privileges
- Provides verification output

**Important Notes:**
- The default password is `TempPass123!` - **change this immediately after first login**
- Super admin access allows platform-wide administration
- Access the admin panel at `app.openpeople.ai` (or `app.localhost` in development)

**Alternative Manual Setup:**

If you prefer to create the user manually:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Enter email: `tom@openpeople.ai`
4. Set a password
5. Confirm email: ✅

Then run the SQL script `seed-super-admin.sql` in the Supabase SQL Editor.

## Troubleshooting

- Ensure Supabase environment variables are correctly set
- Check Supabase Dashboard for user creation
- Verify database permissions for profile creation
- Check browser console for any authentication errors