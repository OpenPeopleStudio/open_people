// Super Admin has platform-wide access across all tenants
// Owner has all abilities of admin within their tenant
// Admin has full admin access within their tenant
// Staff has limited operational access (inventory, orders, messages) within their tenant
// Customer has no admin access

export function isSuperAdmin(role?: string) {
  return role === 'super_admin'
}

export function isOwner(role?: string) {
  return role === 'owner'
}

export function isAdmin(role?: string) {
  return role === 'admin' || role === 'owner'
}

export function isStaff(role?: string) {
  return role === 'staff' || role === 'admin' || role === 'owner'
}

export function hasAdminAccess(role?: string) {
  return isStaff(role)
}

export function hasSuperAdminAccess(role?: string) {
  return isSuperAdmin(role)
}

export function hasTenantAdminAccess(role?: string) {
  return isAdmin(role)
}