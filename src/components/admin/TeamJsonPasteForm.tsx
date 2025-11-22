
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const jsonSchema = z.object({
  jsonContent: z.string().min(1, 'JSON content cannot be empty.'),
});

// Allow projectName to be an empty string by removing .min(1)
const teamSchema = z.object({
  teamName: z.string().min(1, 'teamName is required.'),
  projectName: z.string(), // Removed .min(1) to allow empty strings
});

const teamsArraySchema = z.array(teamSchema);

export function TeamJsonPasteForm() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<{ jsonContent: string }>({
    resolver: zodResolver(jsonSchema),
    defaultValues: {
      jsonContent: '',
    },
  });

  const onSubmit = async (data: { jsonContent: string }) => {
    setIsUploading(true);
    try {
      const jsonData = JSON.parse(data.jsonContent);

      let teamsToParse = jsonData;
      if (!Array.isArray(jsonData)) {
        const arrayKey = Object.keys(jsonData).find(key => Array.isArray(jsonData[key]));
        if (arrayKey) {
          teamsToParse = jsonData[arrayKey];
        } else {
          throw new Error("Invalid JSON structure. No array of teams found.");
        }
      }

      const mappedTeams = teamsToParse.map((team: any) => ({
          teamName: team.teamName || team.team_name,
          projectName: team.projectName || team.project_title || team.projectTitle || ''
      }));
      
      const parsedTeams = teamsArraySchema.parse(mappedTeams);

      if (parsedTeams.length === 0) {
        toast({
          title: 'Empty Array',
          description: 'The JSON content contains an empty array of teams.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

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
      console.error('Error uploading teams from text:', error);
      let errorMessage = 'An unknown error occurred.';
      if (error instanceof z.ZodError) {
        errorMessage = 'The data does not match the required format. Each team must have a `teamName`.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="jsonContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paste JSON Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Paste your JSON array here. For example: [{"teamName": "Innovators", "projectName": "New App"}]'
                  className="min-h-[200px] font-mono text-xs"
                  {...field}
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
