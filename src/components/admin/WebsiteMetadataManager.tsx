import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

export const WebsiteMetadataManager: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchCurrentMetadata();
  }, []);

  const fetchCurrentMetadata = async () => {
    const { data } = await supabase
      .from('website_metadata')
      .select('og_image_url')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();
    
    if (data) {
      setCurrentImageUrl(data.og_image_url);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Check if bucket exists, if not create it
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === 'website-assets');
      
      if (!bucketExists) {
        console.log('Creating bucket...');
        const { error: bucketError } = await supabase.storage.createBucket('website-assets', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        
        if (bucketError) {
          console.error('Bucket creation error:', bucketError);
          throw bucketError;
        }
      }

      // Upload to Supabase Storage
      const fileName = `og-image-${Date.now()}.${file.type.split('/')[1]}`;
      console.log('Uploading file:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('website-assets')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Update database
      const { error: updateError } = await supabase
        .from('website_metadata')
        .update({ 
          og_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      setCurrentImageUrl(publicUrl);
      toast({
        title: 'Success',
        description: 'OG image updated successfully',
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Website Metadata
        </CardTitle>
        <CardDescription>
          Manage the website's Open Graph image (shown when sharing on social media)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Current OG Image</label>
          {currentImageUrl && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <img 
                src={currentImageUrl} 
                alt="Current OG Image" 
                className="max-w-full h-auto max-h-64 mx-auto"
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Upload New Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Recommended: 1200x630px, max 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
