'use client'

import { useState } from 'react'

interface LoginActivity {
  id: string
  timestamp: string
  ip_address: string
  user_agent: string
  location?: string
}

interface CustomerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  customer: {
    id: string
    name: string
    email: string
    phone?: string
    created_at: string
    hasEncryption: boolean
  }
  onDeleteUser?: (userId: string) => Promise<void>
  onSendPaymentRequest?: (userId: string, amount: number, description: string) => Promise<void>
  onToggleEncryption?: (userId: string, enabled: boolean) => Promise<void>
  loginActivity?: LoginActivity[]
}

export default function CustomerProfileModal({
  isOpen,
  onClose,
  customer,
  onDeleteUser,
  onSendPaymentRequest,
  onToggleEncryption,
  loginActivity = [],
}: CustomerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'encryption' | 'activity' | 'payment'>('info')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [sendingPayment, setSendingPayment] = useState(false)

  if (!isOpen) return null

  const handleDeleteUser = async () => {
    if (!onDeleteUser) return
    setIsDeleting(true)
    try {
      await onDeleteUser(customer.id)
      onClose()
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSendPaymentRequest = async () => {
    if (!onSendPaymentRequest || !paymentAmount) return
    setSendingPayment(true)
    try {
      await onSendPaymentRequest(customer.id, parseFloat(paymentAmount), paymentDescription)
      setPaymentAmount('')
      setPaymentDescription('')
    } catch (error) {
      console.error('Error sending payment request:', error)
    } finally {
      setSendingPayment(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 flex items-center justify-center text-lg font-bold text-[var(--text-primary)] border border-[var(--border-primary)]">
                {customer.name[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{customer.name}</h2>
                <p className="text-sm text-[var(--text-muted)]">{customer.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border-primary)] px-6">
            {[
              { id: 'info', label: 'Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'encryption', label: 'Encryption', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
              { id: 'activity', label: 'Activity', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'payment', label: 'Payment', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[var(--neon-magenta)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Customer Since</label>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{formatDate(customer.created_at)}</p>
                </div>
                {customer.phone && (
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Phone</label>
                    <p className="text-sm text-[var(--text-primary)] mt-1">{customer.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Customer ID</label>
                  <p className="text-sm font-mono text-[var(--text-muted)] mt-1">{customer.id}</p>
                </div>
                
                {/* Delete User */}
                <div className="pt-4 border-t border-[var(--border-primary)]">
                  <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-2">Danger Zone</label>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                      Delete Customer
                    </button>
                  ) : (
                    <div className="space-y-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-500">
                        Are you sure? This will permanently delete all customer data including messages, orders, and profile information.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteUser}
                          disabled={isDeleting}
                          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Encryption Tab */}
            {activeTab === 'encryption' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-tertiary)]">
                  <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${customer.hasEncryption ? 'text-green-500' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">End-to-End Encryption</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      {customer.hasEncryption 
                        ? 'This customer has end-to-end encryption enabled. Messages are fully encrypted and can only be read by the customer.'
                        : 'This customer has not set up encryption yet. Messages are stored securely but not end-to-end encrypted.'
                      }
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-muted)]">Status:</span>
                      <span className={`text-sm font-semibold ${customer.hasEncryption ? 'text-green-500' : 'text-yellow-500'}`}>
                        {customer.hasEncryption ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
                {onToggleEncryption && (
                  <button
                    onClick={() => onToggleEncryption(customer.id, !customer.hasEncryption)}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors text-sm font-medium"
                  >
                    {customer.hasEncryption ? 'Disable Encryption' : 'Enable Encryption'}
                  </button>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Recent Login Activity</h3>
                {loginActivity.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-8">No recent activity</p>
                ) : (
                  loginActivity.map((activity) => (
                    <div key={activity.id} className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(activity.timestamp)}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{activity.ip_address}</p>
                          {activity.location && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">📍 {activity.location}</p>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-2 truncate">{activity.user_agent}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Send Payment Request</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Request a payment from this customer. They will receive a notification with the payment details.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Amount ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder=""
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--neon-magenta)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description</label>
                  <textarea
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    placeholder="What is this payment for?"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--neon-magenta)] resize-none"
                  />
                </div>
                <button
                  onClick={handleSendPaymentRequest}
                  disabled={!paymentAmount || sendingPayment || !onSendPaymentRequest}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingPayment ? 'Sending...' : 'Send Payment Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
