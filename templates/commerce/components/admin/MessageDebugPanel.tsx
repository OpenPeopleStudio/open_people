'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Button from '../../../components/ui/Button'
import Surface from '../../../components/ui/Surface'

interface DebugInfo {
  tenantId: string | null
  userId: string | null
  userRole: string | null
  realtimeStatus: string
  publicKey: string | null
  messagesCount: number
  lastMessage: any
  encryptionReady: boolean
}

export default function MessageDebugPanel({ 
  isInitialized, 
  isLocked,
  publicKey,
  adminId,
  show,
  onShowChange,
  hideTrigger = false,
}: { 
  isInitialized: boolean
  isLocked: boolean
  publicKey: string | null
  adminId: string | null
  show?: boolean
  onShowChange?: (show: boolean) => void
  hideTrigger?: boolean
}) {
  const { id: tenantId } = useTenant()
  const [internalShow, setInternalShow] = useState(false)
  const [info, setInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const isControlled = typeof show === 'boolean' && !!onShowChange
  const isOpen = isControlled ? show : internalShow

  const toggleShow = () => {
    if (isControlled) {
      onShowChange?.(!show)
      return
    }
    setInternalShow((prev) => !prev)
  }

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: profile } = await supabase
        .from('709_profiles')
        .select('role, public_key, tenant_id')
        .eq('id', user?.id || '')
        .single()

      const { data: messages, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)

      // Test realtime subscription
      let realtimeStatus = 'Testing...'
      const channel = supabase
        .channel('debug-test')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          realtimeStatus = 'SUBSCRIBED'
        })
        .subscribe((status) => {
          realtimeStatus = status
        })

      setTimeout(() => {
        setInfo({
          tenantId: tenantId,
          userId: user?.id || null,
          userRole: profile?.role || null,
          realtimeStatus,
          publicKey: profile?.public_key || null,
          messagesCount: count || 0,
          lastMessage: messages?.[0] || null,
          encryptionReady: isInitialized && !isLocked && !!publicKey,
        })
        supabase.removeChannel(channel)
        setLoading(false)
      }, 2000)
    } catch (err) {
      console.error('Debug error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!hideTrigger && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleShow}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
        >
          {isOpen ? 'Hide' : 'Debug'} 🔍
        </Button>
      )}

      {isOpen && (
        <Surface className="absolute bottom-12 right-0 w-96 max-h-[600px] overflow-y-auto">
          <div className="p-4 border-b border-[var(--border-primary)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Message System Debug</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={runDiagnostics}
              disabled={loading}
              className="mt-2 w-full"
            >
              {loading ? 'Running...' : 'Run Diagnostics'}
            </Button>
          </div>

          {info && (
            <div className="p-4 space-y-3 text-sm">
              <div>
                <p className="font-medium text-[var(--text-muted)] mb-1">Tenant ID</p>
                <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                  {info.tenantId || 'NOT SET ⚠️'}
                </code>
              </div>

              <div>
                <p className="font-medium text-[var(--text-muted)] mb-1">User Role</p>
                <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                  {info.userRole || 'UNKNOWN ⚠️'}
                </code>
              </div>

              <div>
                <p className="font-medium text-[var(--text-muted)] mb-1">Encryption Status</p>
                <div className="space-y-1">
                  <p className="text-xs">
                    Initialized: {isInitialized ? '✅' : '❌'}
                  </p>
                  <p className="text-xs">
                    Locked: {isLocked ? '🔒 YES' : '✅ NO'}
                  </p>
                  <p className="text-xs">
                    Has Public Key: {info.publicKey ? '✅' : '❌'}
                  </p>
                  <p className="text-xs">
                    Ready: {info.encryptionReady ? '✅' : '❌'}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-medium text-[var(--text-muted)] mb-1">Realtime Status</p>
                <code className={`text-xs px-2 py-1 rounded ${
                  info.realtimeStatus === 'SUBSCRIBED' 
                    ? 'bg-[var(--success)]/20 text-[var(--success)]'
                    : 'bg-[var(--warning)]/20 text-[var(--warning)]'
                }`}>
                  {info.realtimeStatus}
                </code>
              </div>

              <div>
                <p className="font-medium text-[var(--text-muted)] mb-1">Messages Count</p>
                <p className="text-xs">{info.messagesCount} total</p>
              </div>

              {info.lastMessage && (
                <div>
                  <p className="font-medium text-[var(--text-muted)] mb-1">Last Message</p>
                  <div className="text-xs space-y-1 bg-[var(--bg-tertiary)] p-2 rounded">
                    <p>ID: {info.lastMessage.id.substring(0, 8)}...</p>
                    <p>Encrypted: {info.lastMessage.encrypted ? '🔐 Yes' : '📝 No'}</p>
                    <p>Sender: {info.lastMessage.sender_type}</p>
                    <p>Tenant: {info.lastMessage.tenant_id || 'NULL ⚠️'}</p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[var(--border-primary)]">
                <p className="text-xs text-[var(--text-muted)] font-medium mb-2">Quick Checks</p>
                <div className="space-y-1 text-xs">
                  <p className={info.tenantId ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                    {info.tenantId ? '✅' : '❌'} Tenant context loaded
                  </p>
                  <p className={info.userRole ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                    {info.userRole ? '✅' : '❌'} User role set
                  </p>
                  <p className={info.realtimeStatus === 'SUBSCRIBED' ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                    {info.realtimeStatus === 'SUBSCRIBED' ? '✅' : '❌'} Realtime active
                  </p>
                  <p className={info.encryptionReady ? 'text-[var(--success)]' : 'text-[var(--warning)]'}>
                    {info.encryptionReady ? '✅' : '⚠️'} Encryption ready
                  </p>
                </div>
              </div>

              {adminId && (
                <div className="pt-3 border-t border-[var(--border-primary)]">
                  <p className="text-xs text-[var(--text-muted)]">
                    Admin ID: <code className="text-xs">{adminId.substring(0, 8)}...</code>
                  </p>
                </div>
              )}
            </div>
          )}

          {!info && !loading && (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">
              Click "Run Diagnostics" to check system status
            </div>
          )}
        </Surface>
      )}
    </div>
  )
}
