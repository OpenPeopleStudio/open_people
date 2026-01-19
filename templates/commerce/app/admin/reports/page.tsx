'use client'

import { useState, useEffect } from 'react'

interface KPIs {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  conversionRate: number
  topProducts: Array<{ name: string; sold: number; revenue: number }>
  topBrands: Array<{ brand: string; sold: number; revenue: number }>
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>
  inventoryValue: number
  lowStockCount: number
  pendingOrders: number
}

const dateRangeOptions = [
  { value: '0', label: 'Today', shortLabel: 'Today' },
  { value: '1', label: 'Yesterday', shortLabel: 'Yesterday' },
  { value: '7', label: 'Last 7 days', shortLabel: '7 days' },
  { value: '30', label: 'Last 30 days', shortLabel: '30 days' },
  { value: '90', label: 'Last 90 days', shortLabel: '90 days' },
  { value: '365', label: 'Last year', shortLabel: '1 year' },
]

export default function ReportsPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [exporting, setExporting] = useState<string | null>(null)

  const selectedOption = dateRangeOptions.find(o => o.value === dateRange)

  useEffect(() => {
    fetchKPIs()
  }, [dateRange])

  const fetchKPIs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports?days=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setKpis(data)
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async (type: string) => {
    setExporting(type)
    try {
      const response = await fetch(`/api/admin/reports/export?type=${type}&days=${dateRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Reports & Analytics</h1>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports & Analytics</h1>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          {/* Quick select buttons - hidden on mobile, shown on larger screens */}
          <div className="hidden md:flex items-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-1">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  dateRange === option.value
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
          
          {/* Dropdown for mobile */}
          <div className="md:hidden relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent cursor-pointer"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Calendar icon indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-muted)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{selectedOption?.label}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-sm text-[var(--text-muted)] mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-[var(--success)]">
            ${((kpis?.totalRevenue || 0) / 100).toLocaleString()}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-sm text-[var(--text-muted)] mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {kpis?.totalOrders || 0}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-sm text-[var(--text-muted)] mb-1">Average Order Value</p>
          <p className="text-3xl font-bold text-[var(--accent)]">
            ${((kpis?.averageOrderValue || 0) / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-sm text-[var(--text-muted)] mb-1">Inventory Value</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            ${((kpis?.inventoryValue || 0) / 100).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-xl">📦</span>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Pending Orders</p>
            <p className="text-xl font-bold text-[var(--warning)]">{kpis?.pendingOrders || 0}</p>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--error)]/20 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Low Stock Items</p>
            <p className="text-xl font-bold text-[var(--error)]">{kpis?.lowStockCount || 0}</p>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
            <span className="text-xl">📈</span>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Conversion Rate</p>
            <p className="text-xl font-bold text-[var(--success)]">{(kpis?.conversionRate || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
            <h2 className="font-semibold text-[var(--text-primary)]">Top Products</h2>
            <button
              onClick={() => exportCSV('products')}
              disabled={exporting === 'products'}
              className="text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
            >
              {exporting === 'products' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Sold</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {kpis?.topProducts?.slice(0, 5).map((product, i) => (
                <tr key={i} className="hover:bg-[var(--bg-tertiary)]">
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{product.sold}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--success)]">
                    ${(product.revenue / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
              {(!kpis?.topProducts || kpis.topProducts.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No sales data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Brands */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
            <h2 className="font-semibold text-[var(--text-primary)]">Top Brands</h2>
            <button
              onClick={() => exportCSV('brands')}
              disabled={exporting === 'brands'}
              className="text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
            >
              {exporting === 'brands' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Sold</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {kpis?.topBrands?.slice(0, 5).map((brand, i) => (
                <tr key={i} className="hover:bg-[var(--bg-tertiary)]">
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{brand.brand}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{brand.sold}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--success)]">
                    ${(brand.revenue / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
              {(!kpis?.topBrands || kpis.topBrands.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No sales data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Month */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden mb-8">
        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
          <h2 className="font-semibold text-[var(--text-primary)]">Revenue Over Time</h2>
          <button
            onClick={() => exportCSV('revenue')}
            disabled={exporting === 'revenue'}
            className="text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            {exporting === 'revenue' ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
        <div className="p-4">
          {kpis?.revenueByMonth && kpis.revenueByMonth.length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {kpis.revenueByMonth.map((month, i) => {
                const maxRevenue = Math.max(...kpis.revenueByMonth.map(m => m.revenue))
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-40">
                      <div
                        className="w-full bg-[var(--accent)] rounded-t"
                        style={{ height: `${height}%`, minHeight: month.revenue > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[var(--text-muted)]">{month.month}</p>
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        ${(month.revenue / 100).toFixed(0)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--text-muted)]">
              No revenue data for this period
            </div>
          )}
        </div>
      </div>

      {/* Export All */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Export Reports</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportCSV('orders')}
            disabled={exporting === 'orders'}
            className="btn-secondary"
          >
            {exporting === 'orders' ? 'Exporting...' : 'Export Orders'}
          </button>
          <button
            onClick={() => exportCSV('inventory')}
            disabled={exporting === 'inventory'}
            className="btn-secondary"
          >
            {exporting === 'inventory' ? 'Exporting...' : 'Export Inventory'}
          </button>
          <button
            onClick={() => exportCSV('customers')}
            disabled={exporting === 'customers'}
            className="btn-secondary"
          >
            {exporting === 'customers' ? 'Exporting...' : 'Export Customers'}
          </button>
        </div>
      </div>
    </div>
  )
}
