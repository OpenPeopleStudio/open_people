'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../@/lib/supabaseClient'

export default function AuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash.substring(1)
        
        if (!hash) {
          setStatus('No authentication data found')
          setTimeout(() => router.push('/'), 2000)
          return
        }

        // Parse the hash parameters
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (accessToken && refreshToken) {
          // Set the session using the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('Auth error:', error)
            setStatus('Authentication failed: ' + error.message)
            setTimeout(() => router.push('/?error=auth'), 2000)
            return
          }

          setStatus('Authentication successful! Redirecting...')
          
          // Redirect based on type or default to home
          if (type === 'invite' || type === 'signup') {
            router.push('/admin/products')
          } else {
            router.push('/')
          }
        } else {
          setStatus('Invalid authentication data')
          setTimeout(() => router.push('/'), 2000)
        }
      } catch (error) {
        console.error('Auth handling error:', error)
        setStatus('An error occurred during authentication')
        setTimeout(() => router.push('/?error=auth'), 2000)
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}
