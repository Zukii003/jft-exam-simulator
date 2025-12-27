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
      // Upload to Supabase Storage
      const fileName = `og-image-${Date.now()}.${file.type.split('/')[1]}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('website-assets')
        .getPublicUrl(fileName);

      // Update database
      const { error: updateError } = await supabase
        .from('website_metadata')
        .update({ 
          og_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (updateError) throw updateError;

      setCurrentImageUrl(publicUrl);
      toast({
        title: 'Success',
        description: 'OG image updated successfully',
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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
