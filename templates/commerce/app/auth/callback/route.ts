import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // recovery, signup, invite, magiclink
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Handle different auth types
      if (type === 'recovery') {
        // Password reset - redirect to reset password page
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      
      if (type === 'signup' || type === 'invite') {
        // New user - redirect to account setup or admin
        return NextResponse.redirect(`${origin}/account`)
      }
      
      // Default redirect
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    // Handle specific error for recovery
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth`)
}
