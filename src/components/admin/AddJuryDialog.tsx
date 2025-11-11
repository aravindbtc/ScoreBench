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
import { addJury } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

const jurySchema = z.object({
  name: z.string().min(2, 'Jury name must be at least 2 characters.'),
  panelNo: z.coerce.number().int().min(1, 'Panel number must be at least 1.'),
});

type JuryFormData = z.infer<typeof jurySchema>;

interface AddJuryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddJuryDialog({ isOpen, onOpenChange }: AddJuryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<JuryFormData>({
    resolver: zodResolver(jurySchema),
    defaultValues: {
      name: '',
      panelNo: undefined,
    },
  });

  const onSubmit = async (data: JuryFormData) => {
    setIsSubmitting(true);
    const result = await addJury(data);

    if (result.success) {
      toast({
        title: 'Jury Added',
        description: result.message,
      });
      form.reset();
      onOpenChange(false);
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
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
                    <Input id="name" placeholder="e.g., Panel 4" {...field} />
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
                    <Input id="panelNo" type="number" placeholder="e.g., 4" {...field} />
                  </FormControl>
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
