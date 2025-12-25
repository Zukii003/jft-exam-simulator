-- Make the exam-assets bucket private
UPDATE storage.buckets SET public = false WHERE id = 'exam-assets';

-- Add RLS policy for authenticated users to view exam assets
CREATE POLICY "Authenticated users can view exam assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'exam-assets');