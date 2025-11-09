
'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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
  const { toast } = useToast();

  const form = useForm<{ imageFile: FileList }>({
    resolver: zodResolver(fileSchema),
  });

  const onSubmit = async (data: { imageFile: FileList }) => {
    setIsUploading(true);
    const file = data.imageFile[0];
    const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      onUploadComplete(url);
      toast({
        title: 'Upload Successful',
        description: 'Image URL has been pasted into the form below.',
      });
      form.reset();
    } catch (error) {
      console.error("Upload failed", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
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
      </form>
    </Form>
  );
}
