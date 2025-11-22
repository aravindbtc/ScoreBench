
'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/lib/firebase-client';

interface ImageUploadFormProps {
  onUploadComplete: (url: string) => void;
}

export function ImageUploadForm({ onUploadComplete }: ImageUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a ref to hold the storage instance to prevent re-initialization on re-renders
  const storage = useRef(initializeFirebase().storage).current;


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

    const uniqueFileName = `login-backgrounds/${new Date().getTime()}-${file.name}`;
    const fileRef = storageRef(storage, uniqueFileName);

    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
        }, 
        (error) => {
            console.error("Firebase Storage upload failed:", error);
            let description = 'Could not upload the image. Check the console for details.';
            if (error.code === 'storage/unauthorized') {
                description = 'You do not have permission to upload files. Please check your Firebase Storage security rules.';
            }
             toast({
                title: 'Upload Failed',
                description,
                variant: 'destructive',
            });
            setIsUploading(false);
        }, 
        () => {
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

  }, [onUploadComplete, storage, toast]);


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
                toast({ title: 'Image Pasted!', description: 'Starting upload via Firebase...' });
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
          Copy an image to your clipboard and paste it here (Ctrl+V / Cmd+V) to upload via Firebase.
        </p>
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t"></div>
        <span className="flex-shrink mx-4 text-xs">OR</span>
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
