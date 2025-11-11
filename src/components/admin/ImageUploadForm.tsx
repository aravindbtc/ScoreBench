'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Progress } from '../ui/progress';

const fileSchema = z.object({
  imageFile: z
    .any()
    .refine((files) => files?.length === 1, 'Image file is required.')
    .refine((files) => files?.[0]?.type.startsWith('image/'), 'Must be an image file.'),
});

interface ImageUploadFormProps {
  onUploadComplete: (url: string) => void;
}

export function ImageUploadForm({ onUploadComplete }: ImageUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const form = useForm<{ imageFile: FileList }>({
    resolver: zodResolver(fileSchema),
  });

  const onSubmit = (data: { imageFile: FileList }) => {
    const file = data.imageFile[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed", error);
        toast({
          title: 'Upload Failed',
          description: error.message || 'An unknown error occurred during upload.',
          variant: 'destructive',
        });
        setIsUploading(false);
        setUploadProgress(0);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => {
            onUploadComplete(downloadURL);
            toast({
              title: 'Upload Successful',
              description: 'Image URL has been pasted into the form below.',
            });
            form.reset();
          })
          .catch((error) => {
            console.error("Failed to get download URL", error);
            toast({
              title: 'Upload Processing Failed',
              description: 'Could not get the image URL after upload.',
              variant: 'destructive',
            });
          })
          .finally(() => {
            setIsUploading(false);
            setUploadProgress(0);
          });
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="imageFile"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <Label htmlFor="imageFile">Upload a New Image</Label>
                <FormControl>
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => field.onChange(e.target.files)}
                    disabled={isUploading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isUploading}>
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
    </Form>
  );
}
