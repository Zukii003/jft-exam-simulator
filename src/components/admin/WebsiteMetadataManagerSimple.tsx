import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

export const WebsiteMetadataManager: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('/og-image.jpg');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      // For now, just show preview (in production, this would upload to server)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCurrentImageUrl(result);
        toast({
          title: 'Preview Updated',
          description: 'Image preview updated. In production, this would be saved to server.',
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process image',
        variant: 'destructive',
      });
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <div className="border rounded-lg p-4 bg-gray-50">
            <img 
              src={currentImageUrl} 
              alt="Current OG Image" 
              className="max-w-full h-auto max-h-64 mx-auto"
              onError={(e) => {
                e.currentTarget.src = 'https://lovable.dev/opengraph-image-p98pqg.png';
              }}
            />
          </div>
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
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Recommended: 1200x630px, max 5MB<br/>
            <strong>Note:</strong> This is a preview. In production, images are saved to the server.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
