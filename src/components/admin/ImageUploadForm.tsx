
'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImageKit from 'imagekit-javascript';

interface ImageUploadFormProps {
  onUploadComplete: (url: string) => void;
}

export function ImageUploadForm({ onUploadComplete }: ImageUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
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
    setProgress(0);

    try {
      // 1. Fetch authentication parameters from our server
      const authRes = await fetch('/api/imagekit-auth');
      if (!authRes.ok) {
        throw new Error('Failed to get upload credentials. Is your server running and are environment variables set?');
      }
      const authParams = await authRes.json();
      
      const imagekit = new ImageKit({
        urlEndpoint: authParams.urlEndpoint,
        publicKey: authParams.publicKey,
        authenticationEndpoint: '/api/imagekit-auth'
      });

      // 2. Upload the file to ImageKit
      imagekit.upload({
        file: selectedFile,
        fileName: selectedFile.name,
        token: authParams.token,
        signature: authParams.signature,
        expire: authParams.expire,
        useUniqueFileName: true,
      }, (err, result) => {
        if (err) {
          console.error("ImageKit upload failed:", err);
          toast({
            title: 'Upload Failed',
            description: 'Could not upload the image. Check the console for details.',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }

        console.log("ImageKit upload successful:", result);
        if (result) {
          onUploadComplete(result.url);
        }
        
        setIsUploading(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Upload process failed:', error);
      toast({
        title: 'Upload Failed',
        description: message,
        variant: 'destructive',
      });
      setIsUploading(false);
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

      {isUploading && (
        <div className="space-y-2">
            <p>Uploading: {Math.round(progress)}%</p>
            <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
      )}

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
