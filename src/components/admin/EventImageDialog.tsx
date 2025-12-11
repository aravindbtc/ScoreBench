
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
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Event } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';


const formSchema = z.object({
  imageUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface EventImageDialogProps {
    event: Event;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EventImageDialog({ event, isOpen, onOpenChange }: EventImageDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: '',
    },
  });

  const docRef = doc(firestore, 'events', event.id);

  useEffect(() => {
    if (event?.backgroundImageUrl) {
        form.setValue('imageUrl', event.backgroundImageUrl);
    } else {
        form.setValue('imageUrl', '');
    }
  }, [event, form]);

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
    
    setDocumentNonBlocking(docRef, { backgroundImageUrl: data.imageUrl }, { merge: true });

    toast({
        title: 'Success!',
        description: `The background for "${event.name}" has been updated.`,
    });

    setIsSaving(false);
    onOpenChange(false);
  };

  const imageUrl = form.watch('imageUrl');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>Edit Background for "{event.name}"</DialogTitle>
                <DialogDescription>
                    Set a custom background for this event's jury login page.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
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
                
                <DialogFooter>
                <Button type="submit" disabled={isSaving || !imageUrl}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Background
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
