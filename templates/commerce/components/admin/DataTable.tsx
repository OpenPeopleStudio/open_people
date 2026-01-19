'use client'

import { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  className?: string
  mobileHidden?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
  mobileCard?: (item: T) => ReactNode
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading,
  emptyMessage = 'No data available',
  mobileCard,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-12 text-center">
        <div className="w-12 h-12 border-3 border-transparent border-t-[var(--neon-magenta)] border-r-[var(--neon-cyan)] rounded-full animate-spin mx-auto mb-4 shadow-[0_0_30px_rgba(255,0,255,0.5)]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Loading...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-12 sm:p-16 text-center">
        <p className="text-[var(--text-secondary)] font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile card view */}
      {mobileCard && (
        <div className="md:hidden space-y-3">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-4 transition-all duration-300 ${
                onRowClick ? 'cursor-pointer active:scale-98 hover:border-[var(--border-glow)]' : ''
              }`}
            >
              {mobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop table view */}
      <div className={`${mobileCard ? 'hidden md:block' : 'block'} bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ${
                      column.mobileHidden ? 'hidden lg:table-cell' : ''
                    } ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-all duration-200 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-white/5'
                      : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm text-[var(--text-primary)] ${
                        column.mobileHidden ? 'hidden lg:table-cell' : ''
                      } ${column.className || ''}`}
                    >
                      {column.render ? column.render(item) : String((item as any)[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
