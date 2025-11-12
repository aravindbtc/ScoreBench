
'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadImageAndGetUrl } from '@/lib/actions';

interface ImageUploadFormProps {
  onUploadComplete: (url: string) => void;
}

export function ImageUploadForm({ onUploadComplete }: ImageUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File Too Large',
          description: 'Please select an image file smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please choose an image file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const result = await uploadImageAndGetUrl(formData);

        if (result.success && result.url) {
            onUploadComplete(result.url);
        } else {
            throw new Error(result.message || 'An unknown error occurred during upload.');
        }

    } catch (error) {
        console.error('Upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          title: 'Upload Failed',
          description: `An error occurred: ${errorMessage}.`,
          variant: 'destructive',
        });
    } finally {
        setIsUploading(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="image-file">Choose an image (max 5MB)</Label>
        <Input
          id="image-file"
          type="file"
          accept="image/png, image/jpeg, image/gif, image/webp"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      {selectedFile && !isUploading && (
        <Alert>
          <AlertDescription>
            Ready to upload: <span className="font-semibold">{selectedFile.name}</span>
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </Button>
    </div>
  );
}
