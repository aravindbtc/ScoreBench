
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { AppLabels } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const labelsSchema = z.object({
  teamLabel: z.string().min(1, 'Team label cannot be empty.'),
  projectLabel: z.string().min(1, 'Project label cannot be empty.'),
});

type LabelsFormData = z.infer<typeof labelsSchema>;

export default function AppSettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const labelsDocRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'labels'), [firestore]);
  const { data: labels, isLoading: isLoadingLabels } = useDoc<AppLabels>(labelsDocRef);

  const form = useForm<LabelsFormData>({
    resolver: zodResolver(labelsSchema),
    defaultValues: {
      teamLabel: 'Team Name',
      projectLabel: 'Project Name',
    },
  });

  useEffect(() => {
    if (labels) {
      form.reset({
        teamLabel: labels.teamLabel,
        projectLabel: labels.projectLabel,
      });
    }
  }, [labels, form]);

  const onSubmit = (data: LabelsFormData) => {
    setIsSubmitting(true);
    
    setDocumentNonBlocking(labelsDocRef!, data);
    
    toast({
      title: 'Settings Saved',
      description: 'Your custom labels have been updated across the app.',
    });
    
    setIsSubmitting(false);
  };

  if (isLoadingLabels) {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">App Settings</h1>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Customize UI Labels</CardTitle>
          <CardDescription>
            Change the default labels for "Team" and "Project" to fit your event's terminology (e.g., "Participant" and "Idea").
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="teamLabel"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="teamLabel">Label for "Team"</Label>
                    <FormControl>
                      <Input id="teamLabel" placeholder="e.g., Team, Participant, Group" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectLabel"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="projectLabel">Label for "Project"</Label>
                    <FormControl>
                      <Input id="projectLabel" placeholder="e.g., Project, Idea, Prototype" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
