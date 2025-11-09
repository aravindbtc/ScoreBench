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
import { Loader2, Copy } from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Card, CardContent } from '../ui/card';

const fileSchema = z.object({
  imageFile: z
    .any()
    .refine((files) => files?.length === 1, 'Image file is required.')
    .refine((files) => files?.[0]?.type.startsWith('image/'), 'Must be an image file.'),
});

export function ImageUploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<{ imageFile: FileList }>({
    resolver: zodResolver(fileSchema),
  });

  const onSubmit = async (data: { imageFile: FileList }) => {
    setIsUploading(true);
    setDownloadURL(null);
    const file = data.imageFile[0];
    const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setDownloadURL(url);
      toast({
        title: 'Upload Successful',
        description: 'Image has been uploaded and the public URL is available.',
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
  
  const handleCopy = () => {
    if (!downloadURL) return;
    navigator.clipboard.writeText(downloadURL);
    toast({
        title: 'Copied!',
        description: 'The image URL has been copied to your clipboard.'
    });
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="imageFile"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="imageFile">Image File</Label>
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
            Upload Image
          </Button>
        </form>
      </Form>

      {downloadURL && (
        <Card>
            <CardContent className="pt-6">
                <Label>Image URL</Label>
                <div className="flex items-center gap-2 mt-2">
                    <Input readOnly value={downloadURL} className="bg-muted" />
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                 <p className="text-sm text-muted-foreground mt-2">
                    Copy this URL and use it in your application (e.g., in `src/lib/placeholder-images.json`).
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
