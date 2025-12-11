'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { ImageUploadForm } from './ImageUploadForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEvent } from '@/hooks/use-event';
import type { Event } from '@/lib/types';


const formSchema = z.object({
  imageUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomizeLoginFormProps {
    configId: 'preLandingBackground' | 'loginBackground' | 'juryLoginBackground';
    isEventSpecific?: boolean;
}

export function CustomizeLoginForm({ configId, isEventSpecific = false }: CustomizeLoginFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { eventId } = useEvent();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: '',
    },
  });

  const docRef = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isEventSpecific) {
        return eventId ? doc(firestore, 'events', eventId) : null;
    }
    return doc(firestore, 'appConfig', configId);
  }, [firestore, configId, isEventSpecific, eventId]);
  
  const { data: existingData } = useDoc<Event | { imageUrl: string }>(docRef);

  useEffect(() => {
    if (existingData) {
        let url;
        if (isEventSpecific) {
            url = (existingData as Event).backgroundImageUrl;
        } else {
            url = (existingData as { imageUrl: string }).imageUrl;
        }
        if (url) {
            form.setValue('imageUrl', url);
        } else {
             form.setValue('imageUrl', '');
        }
    }
  }, [existingData, form, isEventSpecific]);

  const handleUploadComplete = (url: string) => {
    form.setValue('imageUrl', url, { shouldValidate: true });
    toast({
      title: 'Upload Complete!',
      description: "Image URL is now visible in the input field. Click 'Save Background' to apply.",
    });
  };
  
  const onSubmit = async (data: FormValues) => {
    if (!docRef) {
        toast({ title: "Error", description: isEventSpecific ? "No event selected." : "Configuration path is missing.", variant: "destructive" });
        return;
    };
    if (!data.imageUrl) {
        toast({
            title: 'Error',
            description: 'Image URL cannot be empty.',
            variant: 'destructive',
        });
        return;
    }
    setIsSaving(true);
    
    const dataToSave = isEventSpecific ? { backgroundImageUrl: data.imageUrl } : { imageUrl: data.imageUrl };
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    toast({
        title: 'Success!',
        description: 'The background has been updated. It may take a moment to reflect.',
    });

    setIsSaving(false);
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
                    <FormDescription>
                        Upload your background to a service like ImageKit or Imgur, then paste the public URL here.
                    </FormDescription>
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
