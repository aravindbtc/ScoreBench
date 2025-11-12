
'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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

    const fileName = `login-backgrounds/${Date.now()}-${selectedFile.name}`;
    const fileRef = storageRef(storage, fileName);

    const uploadTask = uploadBytesResumable(fileRef, selectedFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(currentProgress);
        console.log(`Upload is ${currentProgress}% done`);
      },
      (error) => {
        console.error('Upload failed:', error);
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
            case 'storage/unauthorized':
                errorMessage = "Permission denied. Please check your Firebase Storage security rules.";
                break;
            case 'storage/canceled':
                errorMessage = "Upload was canceled.";
                break;
            case 'storage/unknown':
                errorMessage = "An unknown error occurred, possibly a CORS issue. Please check your bucket's CORS configuration.";
                break;
        }
        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsUploading(false);
      },
      () => {
        console.log('Upload complete');
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          onUploadComplete(downloadURL);
          setIsUploading(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });
      }
    );
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
