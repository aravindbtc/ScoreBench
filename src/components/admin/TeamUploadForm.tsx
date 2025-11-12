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
import type { Team } from '@/lib/types';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const fileSchema = z.object({
  jsonFile: z
    .any()
    .refine((files) => files?.length === 1, 'JSON file is required.')
    .refine((files) => files?.[0]?.type === 'application/json', 'Must be a JSON file.'),
});

const teamSchema = z.object({
  teamName: z.string().min(1),
  projectName: z.string().min(1),
});

const teamsArraySchema = z.array(teamSchema);

export function TeamUploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<{ jsonFile: FileList }>({
    resolver: zodResolver(fileSchema),
  });

  const onSubmit = async (data: { jsonFile: FileList }) => {
    setIsUploading(true);
    const file = data.jsonFile[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);
        const parsedTeams = teamsArraySchema.parse(jsonData);

        const batch = writeBatch(firestore);
        const teamsCollection = collection(firestore, 'teams');
        parsedTeams.forEach((team) => {
          const docRef = doc(teamsCollection);
          batch.set(docRef, team);
        });

        await batch.commit();

        toast({
          title: 'Upload Successful',
          description: `${parsedTeams.length} teams uploaded successfully.`,
        });
        form.reset();
      } catch (error) {
        console.error('Error uploading teams:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          title: 'Upload Failed',
          description: `Invalid JSON format or content. ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
        toast({
            title: "File Read Error",
            description: "Could not read the selected file.",
            variant: "destructive"
        })
        setIsUploading(false);
    }

    reader.readAsText(file);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="jsonFile"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="jsonFile">Team Data (.json)</Label>
              <FormControl>
                <Input
                  id="jsonFile"
                  type="file"
                  accept="application/json"
                  onChange={(e) => field.onChange(e.target.files)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isUploading}>
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload Teams
        </Button>
      </form>
    </Form>
  );
}
