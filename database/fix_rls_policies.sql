-- Drop existing policies
DROP POLICY IF EXISTS "Only admin can manage website metadata" ON website_metadata;
DROP POLICY IF EXISTS "Admin can upload to website-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update website-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete website-assets" ON storage.objects;

-- Create simplified policies for website_metadata
CREATE POLICY "Admin can manage website metadata" ON website_metadata
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Create simplified policies for storage
CREATE POLICY "Admin can manage website-assets" ON storage.objects
FOR ALL USING (
  bucket_id = 'website-assets' AND 
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow public read access to website-assets
CREATE POLICY "Public can view website-assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'website-assets'
);
