'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProductsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new unified inventory page
    router.replace('/admin/inventory')
  }, [router])

  return (
    <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}
