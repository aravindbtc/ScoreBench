
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import NextImage from 'next/image';
import { updateLoginBackground, getLoginBackground } from '@/lib/actions';
import { Skeleton } from '../ui/skeleton';
import { ImageUploadForm } from './ImageUploadForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const urlSchema = z.object({
  imageUrl: z.string().url('Please enter a valid URL.'),
});

export function CustomizeLoginForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<{ imageUrl: string }>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      imageUrl: '',
    },
  });

  useEffect(() => {
    async function fetchInitialBackground() {
      setIsLoading(true);
      const bg = await getLoginBackground();
      if (bg) {
        form.reset({ imageUrl: bg.imageUrl });
      }
      setIsLoading(false);
    }
    fetchInitialBackground();
  }, [form]);

  const handleUploadComplete = (url: string) => {
    form.setValue('imageUrl', url);
    toast({
      title: 'Upload Complete!',
      description: "Image URL has been set. Click 'Save Background' to apply.",
    });
  };
  
  const onSubmit = async (data: { imageUrl: string }) => {
    setIsSaving(true);
    const result = await updateLoginBackground(data);
    if (result.success) {
      toast({
        title: 'Success!',
        description: 'The login background has been updated.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const imageUrl = form.watch('imageUrl');

  if (isLoading) {
    return <Skeleton className="h-[450px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Current Background Preview</h3>
        <div className="rounded-lg border overflow-hidden aspect-video relative max-h-64 bg-muted">
            {imageUrl ? (
                <NextImage
                    src={imageUrl}
                    alt="Current login background"
                    fill
                    className="object-cover"
                />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No image URL set.</p>
              </div>
            )}
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
          <TabsTrigger value="url">Set from URL</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-6">
            <ImageUploadForm onUploadComplete={handleUploadComplete} />
        </TabsContent>
        <TabsContent value="url" className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <FormControl>
                        <Input id="imageUrl" placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
        </TabsContent>
      </Tabs>
      
      <div className="pt-6 border-t">
         <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving || !imageUrl}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Background
          </Button>
      </div>
    </div>
  );
}
