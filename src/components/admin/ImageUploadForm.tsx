'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Progress } from '../ui/progress';

interface ImageUploadFormProps {
  onUploadComplete: (url: string) => void;
}

export function ImageUploadForm({ onUploadComplete }: ImageUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image file to upload.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedFile.type.startsWith('image/')) {
       toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `uploads/${Date.now()}-${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload failed', error);
        toast({
          title: 'Upload Failed',
          description: error.message || 'An unknown error occurred during upload. Check console for details.',
          variant: 'destructive',
        });
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      () => {
        console.log('Upload complete. Getting download URL...');
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => {
            console.log('Successfully got download URL:', downloadURL);
            onUploadComplete(downloadURL);
            toast({
              title: 'Upload Successful',
              description: 'Image URL has been pasted into the form below.',
            });
          })
          .catch((error) => {
            console.error('Failed to get download URL', error);
            toast({
              title: 'Upload Processing Failed',
              description: 'Could not get the image URL after upload. Check console for details.',
              variant: 'destructive',
            });
          })
          .finally(() => {
            console.log('Resetting upload state.');
            setIsUploading(false);
            setUploadProgress(0);
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          });
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-grow space-y-2">
           <Label htmlFor="imageFile">Upload a New Image</Label>
           <Input
            id="imageFile"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        <Button type="submit" disabled={isUploading || !selectedFile}>
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload
        </Button>
      </div>
      {isUploading && (
        <div className="space-y-2">
          <Label>Upload Progress</Label>
          <Progress value={uploadProgress} />
        </div>
      )}
    </form>
  );
}
