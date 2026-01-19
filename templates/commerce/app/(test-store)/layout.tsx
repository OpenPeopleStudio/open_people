import { ReactNode } from 'react'
import './test-store.css'
import TestStoreHeader from './components/TestStoreHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '709exclusive | Test Store',
  description: 'Minimal shoe catalog',
}

export default function TestStoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="light-mode min-h-screen bg-white text-gray-900">
      <TestStoreHeader />
      <main className="pt-14">
        {children}
      </main>
    </div>
  )
}
