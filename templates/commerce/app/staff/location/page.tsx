import { redirect } from 'next/navigation'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isStaff } from '../lib/roles'
import StaffLocationClient from './staff-location-client'

export default async function StaffLocationPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!isStaff(profile?.role)) {
    redirect('/')
  }

  const staffName = profile?.full_name || user.email || 'Staff'

  return <StaffLocationClient staffName={staffName} />
}
