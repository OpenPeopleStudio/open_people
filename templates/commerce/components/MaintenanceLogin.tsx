'use client'

import { useState } from 'react'
import Button from '../../../components/ui/Button'
import LoginModal from '../../../components/LoginModal'

export default function MaintenanceLogin() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsLoginOpen(true)}
      >
        Staff login
      </Button>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  )
}
