
'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImageKit from 'imagekit-javascript';
import { Progress } from '@/components/ui/progress';

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
  
  const uploadFile = useCallback((file: File) => {
    setIsUploading(true);
    setProgress(0);

    const processUpload = async () => {
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
                file: file,
                fileName: file.name,
                token: authParams.token,
                signature: authParams.signature,
                expire: authParams.expire,
                useUniqueFileName: true,
                onUploadProgress: (progress) => {
                    setProgress(progress.loaded / progress.total * 100);
                }
            }, (err, result) => {
                setIsUploading(false);
                if (err) {
                    console.error("ImageKit upload failed:", err);
                    let description = 'Could not upload the image. Check the console for details.';
                    if (String(err).includes('security')) {
                        description = 'A security error occurred. This often means your ImageKit settings are incorrect. Please verify your keys and allowed origins in the ImageKit dashboard.';
                    }
                    toast({
                        title: 'Upload Failed',
                        description: description,
                        variant: 'destructive',
                    });
                    return;
                }

                if (result) {
                    onUploadComplete(result.url);
                }
                
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
    processUpload();

  }, [onUploadComplete, toast]);


  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please choose an image file to upload.',
        variant: 'destructive',
      });
      return;
    }
    uploadFile(selectedFile);
  };
  
  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                 if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    toast({
                    title: 'Pasted Image Too Large',
                    description: 'The pasted image file is larger than 5MB.',
                    variant: 'destructive',
                    });
                    return;
                }
                event.preventDefault(); // Prevent the image from being pasted into any text field
                toast({ title: 'Image Pasted!', description: 'Starting upload...' });
                uploadFile(file);
                break;
            }
        }
    }
  }, [uploadFile, toast]);

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <div className="p-4 text-center border-2 border-dashed rounded-lg bg-muted/50">
        <Copy className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Copy an image to your clipboard and paste it here (Ctrl+V / Cmd+V).
        </p>
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span>
        <div className="flex-grow border-t"></div>
      </div>


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
            <p className="text-sm text-muted-foreground">Uploading: {Math.round(progress)}%</p>
            <Progress value={progress} className="w-full h-2" />
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
        {isUploading ? 'Uploading...' : 'Upload & Set URL'}
      </Button>
    </div>
  );
}
