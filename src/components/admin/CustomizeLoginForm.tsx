
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
import { ImageUploadForm } from './ImageUploadForm';
import { ImagePlaceholder } from '@/lib/types';
import NextImage from 'next/image';
import { updateLoginBackground } from '@/lib/actions';
import { Separator } from '../ui/separator';

const urlSchema = z.object({
  imageUrl: z.string().url('Please enter a valid URL.'),
});

interface CustomizeLoginFormProps {
  currentBackground: ImagePlaceholder;
}

export function CustomizeLoginForm({ currentBackground }: CustomizeLoginFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<{ imageUrl: string }>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      imageUrl: currentBackground.imageUrl,
    },
  });

  const handleUploadComplete = (url: string) => {
    form.setValue('imageUrl', url, { shouldValidate: true });
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

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Current Background</h3>
        <div className="rounded-lg border overflow-hidden aspect-video relative max-h-64 bg-muted">
            {imageUrl && (
                <NextImage
                    src={imageUrl}
                    alt="Current login background"
                    fill
                    className="object-cover"
                />
            )}
        </div>
      </div>

      <ImageUploadForm onUploadComplete={handleUploadComplete} />
      
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="imageUrl">Set Image URL Manually</Label>
                <FormControl>
                  <Input id="imageUrl" placeholder="https://example.com/image.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Background
          </Button>
        </form>
      </Form>
    </div>
  );
}
