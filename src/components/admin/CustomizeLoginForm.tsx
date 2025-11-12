
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
import { updateLoginBackground } from '@/lib/actions';
import { ImageUploadForm } from './ImageUploadForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';

const urlSchema = z.object({
  imageUrl: z.string().url('Please enter a valid URL.'),
});

export function CustomizeLoginForm({ currentImageUrl }: { currentImageUrl: string }) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<{ imageUrl: string }>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      imageUrl: currentImageUrl || '',
    },
  });

  const handleUploadComplete = (url: string) => {
    form.setValue('imageUrl', url, { shouldValidate: true });
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
      // Refresh the page to show the new current background
      router.refresh();
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

  return (
    <div className="space-y-6">
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
