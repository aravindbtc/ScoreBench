
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EvaluationCriterion } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Switch } from '@/components/ui/switch';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, writeBatch, getDocs, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2, Edit } from 'lucide-react';
import { defaultCriteria } from '@/lib/default-criteria';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useEvent } from '@/hooks/use-event';

interface EditCriterionDialogProps {
  criterion: EvaluationCriterion;
  onSave: (updatedCriterion: Partial<EvaluationCriterion>) => void;
}

function EditCriterionDialog({ criterion, onSave }: EditCriterionDialogProps) {
    const [name, setName] = useState(criterion.name);
    const [description, setDescription] = useState(criterion.description);
    const [maxScore, setMaxScore] = useState(criterion.maxScore);
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
        onSave({ name, description, maxScore: Number(maxScore) });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Criterion</DialogTitle>
                    <DialogDescription>
                        Update the details for "{criterion.name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxScore" className="text-right">Max Score</Label>
                        <Input id="maxScore" type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface CriteriaManagementProps {
  criteria: EvaluationCriterion[];
}

export function CriteriaManagement({ criteria: initialCriteria }: CriteriaManagementProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { eventId } = useEvent();
  const [isResetting, setIsResetting] = useState(false);

  const handleUpdate = (criterion: EvaluationCriterion, updates: Partial<EvaluationCriterion>) => {
    if (!eventId) return;
    const docRef = doc(firestore, `events/${eventId}/evaluationCriteria`, criterion.id);
    setDocumentNonBlocking(docRef, updates, { merge: true });
    toast({
      title: 'Criterion Updated',
      description: `${criterion.name} has been updated.`,
    });
  };

  const handleToggle = (criterion: EvaluationCriterion) => {
    handleUpdate(criterion, { active: !criterion.active });
  };

  const handleReset = async () => {
    if (!eventId) return;
    setIsResetting(true);
    try {
        const batch = writeBatch(firestore);
        
        const criteriaCollection = collection(firestore, `events/${eventId}/evaluationCriteria`);
        const currentCriteriaSnapshot = await getDocs(criteriaCollection);
        currentCriteriaSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        for (const c of defaultCriteria) {
            // We must add them one by one to get new random IDs
            const newDocRef = doc(criteriaCollection);
            batch.set(newDocRef, { ...c, id: newDocRef.id });
        }
        
        await batch.commit();

        toast({
            title: 'Criteria Reset',
            description: 'Evaluation criteria have been reset to the default set for this event.',
        });
    } catch (error) {
        console.error("Failed to reset criteria:", error);
        toast({
            title: 'Reset Failed',
            description: 'Could not reset the criteria. Please check the console for details.',
            variant: 'destructive',
        });
    } finally {
        setIsResetting(false);
    }
  };

  const criteria = initialCriteria.length > 0 ? initialCriteria : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Manage Evaluation Criteria</CardTitle>
                <CardDescription>
                Enable, disable, and set scores for judging categories. Changes will reflect on the jury scoring form in real-time.
                </CardDescription>
            </div>
            <Button variant="outline" onClick={handleReset} disabled={isResetting}>
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset to Default
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Active</TableHead>
              <TableHead>Criterion</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Max Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.sort((a, b) => a.name.localeCompare(b.name)).map((criterion) => (
              <TableRow key={criterion.id}>
                <TableCell>
                  <Switch
                    checked={criterion.active}
                    onCheckedChange={() => handleToggle(criterion)}
                    aria-label={`Activate ${criterion.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{criterion.name}</TableCell>
                <TableCell className="text-muted-foreground">{criterion.description}</TableCell>
                <TableCell className="text-center font-medium">{criterion.maxScore}</TableCell>
                <TableCell className="text-right">
                    <EditCriterionDialog criterion={criterion} onSave={(updates) => handleUpdate(criterion, updates)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
