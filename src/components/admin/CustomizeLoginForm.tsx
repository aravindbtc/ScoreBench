
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
import { ImageUploadForm } from './ImageUploadForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateLoginBackground } from '@/lib/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';


const formSchema = z.object({
  imageUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export function CustomizeLoginForm() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: '',
    },
  });

  useEffect(() => {
    // Set the initial value from the local placeholder file
    const initialBg = PlaceHolderImages.find(p => p.id === 'login-background');
    if (initialBg?.imageUrl) {
        form.setValue('imageUrl', initialBg.imageUrl);
    }
  }, [form]);

  const handleUploadComplete = (url: string) => {
    form.setValue('imageUrl', url, { shouldValidate: true });
    toast({
      title: 'Upload Complete!',
      description: "Image URL is now visible in the input field. Click 'Save Background' to apply.",
    });
  };
  
  const onSubmit = async (data: FormValues) => {
    if (!data.imageUrl) {
        toast({
            title: 'Error',
            description: 'Image URL cannot be empty.',
            variant: 'destructive',
        });
        return;
    }
    setIsSaving(true);
    try {
      const result = await updateLoginBackground(data.imageUrl);
       if (result.success) {
        toast({
          title: 'Success!',
          description: 'The login background has been updated. It may take a moment to reflect.',
        });
      } else {
        toast({
          title: 'Save Failed',
          description: result.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
       toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
        setIsSaving(false);
    }
  };

  const imageUrl = form.watch('imageUrl');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="url">Set from URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-6">
              <ImageUploadForm onUploadComplete={handleUploadComplete} />
          </TabsContent>
          <TabsContent value="url" className="mt-6">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <FormControl>
                      <Input id="imageUrl" placeholder="Upload an image or paste a URL here" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </TabsContent>
        </Tabs>
        
        <div className="pt-6 border-t">
           <Button type="submit" disabled={isSaving || !imageUrl}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Background
            </Button>
        </div>
      </form>
    </Form>
  );
}
