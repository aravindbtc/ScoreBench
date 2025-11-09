
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
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

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
  
  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
        title: 'Copied!',
        description: 'The content has been copied to your clipboard.'
    });
  }

  const jsonSnippet = `{
  "id": "login-background",
  "description": "The official poster for the Silver Spark 2025 Ideathon.",
  "imageUrl": "${downloadURL}",
  "imageHint": "ideathon event poster"
}`;

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
          <CardHeader>
            <CardDescription>
              Your image has been uploaded successfully. Use the information below to update the login screen background.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>1. Copy the new configuration</Label>
              <div className="relative mt-2">
                <pre className="text-xs p-4 bg-muted rounded-md border overflow-x-auto">
                  <code>{jsonSnippet}</code>
                </pre>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(jsonSnippet)}>
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
             <Alert>
              <AlertTitle>2. Update the file</AlertTitle>
              <AlertDescription>
                Open the file <code className="font-semibold text-foreground">src/lib/placeholder-images.json</code>, and replace the existing `login-background` object with the code you just copied.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
