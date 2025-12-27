-- Create table for website metadata
CREATE TABLE IF NOT EXISTS website_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  og_image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default record
INSERT INTO website_metadata (id, og_image_url) 
VALUES ('00000000-0000-0000-0000-000000000001', 'https://lovable.dev/opengraph-image-p98pqg.png')
ON CONFLICT (id) DO NOTHING;

-- Create policy for admin only
ALTER TABLE website_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can manage website metadata" ON website_metadata
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
