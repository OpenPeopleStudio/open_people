/**
 * Database table name constants
 * 
 * This file centralizes all table name references to make it easier
 * to rename tables for white-label deployments.
 * 
 * To migrate from legacy table names:
 * 1. Run the SQL migration (044_rename_profiles_table.sql)
 * 2. Update these constants to the new names
 * 3. The application code will automatically use the new names
 */

// User-related tables
// Change these from 'profiles' to 'profiles' after running the migration
export const PROFILES_TABLE = 'profiles' as const
export const VERIFIED_CONTACTS_TABLE = '709_verified_contacts' as const

// Alias for backwards compatibility
export const Tables = {
  profiles: PROFILES_TABLE,
  verifiedContacts: VERIFIED_CONTACTS_TABLE,
} as const

// Type helper for table names
export type TableName = typeof PROFILES_TABLE | typeof VERIFIED_CONTACTS_TABLE
