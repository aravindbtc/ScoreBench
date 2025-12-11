
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import { useEvent } from '@/hooks/use-event';

const teamSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters.'),
  projectName: z.string().min(3, 'Project name must be at least 3 characters.'),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface EditTeamDialogProps {
  team: Team | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  labels: { teamLabel: string, projectLabel: string };
}

export function EditTeamDialog({ team, isOpen, onOpenChange, labels }: EditTeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { eventId } = useEvent();

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      teamName: '',
      projectName: '',
    },
  });

  useEffect(() => {
    if (team) {
      form.reset({
        teamName: team.teamName,
        projectName: team.projectName,
      });
    }
  }, [team, form]);

  const onSubmit = (data: TeamFormData) => {
    if (!team || !eventId) return;

    setIsSubmitting(true);
    const teamDocRef = doc(firestore, `events/${eventId}/teams`, team.id);
    
    setDocumentNonBlocking(teamDocRef, data, { merge: true });

    toast({
      title: 'Team Updated',
      description: `Team "${data.teamName}" has been updated.`,
    });
    
    onOpenChange(false);
    setIsSubmitting(false);
  };

  if (!team) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update the details for "{team.teamName}". Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="teamName">{labels.teamLabel}</Label>
                  <FormControl>
                    <Input id="teamName" placeholder="e.g., The Code Crusaders" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="projectName">{labels.projectLabel}</Label>
                  <FormControl>
                    <Input id="projectName" placeholder="e.g., Eco-Friendly Drone Delivery" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
