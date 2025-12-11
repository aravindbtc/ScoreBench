
'use client';

import { useState } from 'react';
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
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useEvent } from '@/hooks/use-event';

const jurySchema = z.object({
  name: z.string().min(2, 'Jury name must be at least 2 characters.'),
  panelNo: z.coerce.number().int().min(1, 'Panel number must be at least 1.'),
  password: z.string().min(4, 'Password must be at least 4 characters.'),
});

type JuryFormData = z.infer<typeof jurySchema>;

interface AddJuryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddJuryDialog({ isOpen, onOpenChange }: AddJuryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { eventId } = useEvent();

  const form = useForm<JuryFormData>({
    resolver: zodResolver(jurySchema),
    defaultValues: {
      name: '',
      panelNo: '' as any,
      password: '',
    },
  });

  const onSubmit = async (data: JuryFormData) => {
    if (!eventId) {
        toast({ title: "Error", description: "No event selected.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const juriesCollection = collection(firestore, `events/${eventId}/juries`);
      const q = query(juriesCollection, where('panelNo', '==', data.panelNo));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          title: 'Error',
          description: `Panel number ${data.panelNo} already exists for this event.`,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      await addDoc(juriesCollection, data);

      toast({
        title: 'Jury Added',
        description: `Jury "${data.name}" added successfully.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add jury:', error);
      toast({ title: "Error", description: "Could not add jury. See console for details.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Jury Panel</DialogTitle>
          <DialogDescription>
            Enter the details for the new jury panel. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="name">Jury Name</Label>
                  <FormControl>
                    <Input id="name" placeholder="e.g., Industry Experts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="panelNo"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="panelNo">Panel Number</Label>
                  <FormControl>
                    <Input id="panelNo" type="number" placeholder="e.g., 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                 <FormItem>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <FormControl>
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Set a password for this panel"
                            {...field}
                            className="pr-10"
                        />
                    </FormControl>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Jury
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
