import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isAdmin } from '../lib/roles'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const tenant = await getTenantFromRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!tenant?.id) {
      return NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('709_profiles')
      .select('role')
      .eq('id', user.id)
      .eq('tenant_id', tenant.id)
      .single()

    if (!isAdmin(profile?.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a PNG, JPG, GIF, SVG, or WebP image.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `tenant-logos/${tenant.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      url: publicUrl,
      fileName 
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const tenant = await getTenantFromRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!tenant?.id) {
      return NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('709_profiles')
      .select('role')
      .eq('id', user.id)
      .eq('tenant_id', tenant.id)
      .single()

    if (!isAdmin(profile?.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: 'No file name provided' }, { status: 400 })
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('assets')
      .remove([fileName])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete file' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
