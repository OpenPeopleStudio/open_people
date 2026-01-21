"use client";

import { useState, useEffect } from "react";
import { Button, Card, StatusBadge, LoadingSpinner, Modal, ModalActions, FormField, Input } from "@/lib/ui";

/* ═══════════════════════════════════════════════════════════════════════════
   User Management Component

   Allows super admins to manage users across all tenants:
   - View all users with tenant context
   - Create new users
   - Edit user profiles and roles
   - Reset passwords
   - Suspend/activate accounts
   - Bulk operations
   ═══════════════════════════════════════════════════════════════════════════ */

interface PlatformUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  tenant_id?: string;
  tenant_name?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_sign_in_at?: string;
  created_at: string;
  email_confirmed_at?: string;
}

interface UserManagementProps {
  className?: string;
}

export function UserManagement({ className = '' }: UserManagementProps) {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter, tenantFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (roleFilter) params.set('role', roleFilter);
      if (tenantFilter) params.set('tenant', tenantFilter);

      const response = await fetch(`/api/super-admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    full_name?: string;
    role: string;
    tenant_id?: string;
  }) => {
    setUpdating('create');
    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await loadUsers();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setUpdating(null);
    }
  };

  const updateUser = async (userId: string, updates: Partial<PlatformUser>) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await loadUsers();
        setShowEditModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setUpdating(null);
    }
  };

  const resetUserPassword = async (userId: string, newPassword: string) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/super-admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        // Show success message
        alert('Password reset successfully');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await updateUser(userId, { status: newStatus });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'warning';
      case 'owner': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'error';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            User Management
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Manage users across all tenants
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Search
            </label>
            <Input
              placeholder="Email, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Status
            </label>
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Tenants</option>
              {/* Would need to populate with actual tenants */}
              <option value="tenant-1">Acme Corp</option>
              <option value="tenant-2">TechStart Inc</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setTenantFilter('');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Tenant
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Last Sign In
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)]">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {user.full_name || 'No name'}
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={getRoleColor(user.role)}>
                      {user.role.replace('_', ' ')}
                    </StatusBadge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-[var(--text-primary)]">
                      {user.tenant_name || 'No tenant'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={getStatusColor(user.status)}>
                      {user.status}
                    </StatusBadge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-[var(--text-primary)]">
                      {formatDate(user.last_sign_in_at)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        disabled={updating === user.id}
                      >
                        {updating === user.id && <LoadingSpinner size="sm" className="mr-1" />}
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-muted)]">
                No users found matching your criteria
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createUser}
        loading={updating === 'create'}
      />

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUpdate={updateUser}
          onResetPassword={resetUserPassword}
          loading={updating === selectedUser.id}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Create User Modal
   ═══════════════════════════════════════════════════════════════════════════ */

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (userData: any) => Promise<void>;
  loading: boolean;
}

function CreateUserModal({ isOpen, onClose, onCreate, loading }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'member',
    tenant_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate(formData);
    if (!loading) {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'member',
        tenant_id: '',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User"
      description="Add a new user to the platform"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="user@example.com"
          />
        </FormField>

        <FormField label="Full Name">
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="John Doe"
          />
        </FormField>

        <FormField label="Password" required>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Minimum 8 characters"
            minLength={8}
          />
        </FormField>

        <FormField label="Role" required>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="guest">Guest</option>
            <option value="member">Member</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </FormField>

        <FormField label="Tenant">
          <select
            value={formData.tenant_id}
            onChange={(e) => setFormData(prev => ({ ...prev, tenant_id: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="">No tenant (super admin)</option>
            {/* Would need to populate with actual tenants */}
            <option value="tenant-1">Acme Corp</option>
            <option value="tenant-2">TechStart Inc</option>
          </select>
        </FormField>

        <ModalActions>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <LoadingSpinner size="sm" className="mr-2" />}
            Create User
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Edit User Modal
   ═══════════════════════════════════════════════════════════════════════════ */

interface EditUserModalProps {
  user: PlatformUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (userId: string, updates: Partial<PlatformUser>) => Promise<void>;
  onResetPassword: (userId: string, newPassword: string) => Promise<void>;
  loading: boolean;
}

function EditUserModal({ user, isOpen, onClose, onUpdate, onResetPassword, loading }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role: user.role,
    status: user.status,
  });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => {
      setFormData({
        full_name: user.full_name || '',
        role: user.role,
        status: user.status,
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(user.id, formData);
  };

  const handlePasswordReset = async () => {
    if (newPassword.length >= 8) {
      await onResetPassword(user.id, newPassword);
      setShowPasswordReset(false);
      setNewPassword('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      description={`Manage user account: ${user.email}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email">
          <Input value={user.email} disabled />
        </FormField>

        <FormField label="Full Name">
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          />
        </FormField>

        <FormField label="Role">
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="guest">Guest</option>
            <option value="member">Member</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </FormField>

        <FormField label="Status">
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </FormField>

        {/* Password Reset Section */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)]">
                Password Reset
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Reset the user password
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordReset(!showPasswordReset)}
            >
              {showPasswordReset ? 'Cancel' : 'Reset Password'}
            </Button>
          </div>

          {showPasswordReset && (
            <div className="space-y-3">
              <FormField label="New Password">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={8}
                />
              </FormField>
              <Button
                type="button"
                onClick={handlePasswordReset}
                disabled={newPassword.length < 8}
                size="sm"
              >
                Reset Password
              </Button>
            </div>
          )}
        </div>

        <ModalActions>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <LoadingSpinner size="sm" className="mr-2" />}
            Update User
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
