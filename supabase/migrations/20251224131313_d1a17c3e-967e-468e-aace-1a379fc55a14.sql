-- Create storage bucket for exam assets (images and audio)
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-assets', 'exam-assets', true);

-- Create storage policies
CREATE POLICY "Admins can upload exam assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-assets' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update exam assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exam-assets' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete exam assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-assets' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view exam assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exam-assets');

-- Add policy for admins to view all profiles (for export)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));