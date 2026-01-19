-- Create storage bucket for tenant assets (logos, branding, etc.)
-- Run this after setting up your Supabase project

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tenant assets

-- Allow authenticated tenant admins to upload assets to their tenant folder
CREATE POLICY "Tenant admins can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' 
  AND (storage.foldername(name))[1] = 'tenant-logos'
  AND auth.uid() IN (
    SELECT id FROM "709_profiles" 
    WHERE role IN ('admin', 'owner')
    AND tenant_id = (
      SELECT id FROM tenants 
      WHERE id::text = (storage.foldername(name))[2]
    )
  )
);

-- Allow anyone to view assets (public bucket)
CREATE POLICY "Anyone can view assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'assets');

-- Allow tenant admins to delete their own assets
CREATE POLICY "Tenant admins can delete their assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets'
  AND (storage.foldername(name))[1] = 'tenant-logos'
  AND auth.uid() IN (
    SELECT id FROM "709_profiles" 
    WHERE role IN ('admin', 'owner')
    AND tenant_id = (
      SELECT id FROM tenants 
      WHERE id::text = (storage.foldername(name))[2]
    )
  )
);

-- Allow tenant admins to update their own assets
CREATE POLICY "Tenant admins can update their assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets'
  AND (storage.foldername(name))[1] = 'tenant-logos'
  AND auth.uid() IN (
    SELECT id FROM "709_profiles" 
    WHERE role IN ('admin', 'owner')
    AND tenant_id = (
      SELECT id FROM tenants 
      WHERE id::text = (storage.foldername(name))[2]
    )
  )
);
