-- Create bucket for website assets (og images, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-assets', 
  'website-assets', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public Access to website-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'website-assets');

-- Create policy for admin write access
CREATE POLICY "Admin can upload to website-assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admin can update website-assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admin can delete website-assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
