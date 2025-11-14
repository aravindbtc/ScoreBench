
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
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { defaultCriteria } from '@/lib/default-criteria';

interface CriteriaManagementProps {
  criteria: EvaluationCriterion[];
}

export function CriteriaManagement({ criteria: initialCriteria }: CriteriaManagementProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleToggle = (criterion: EvaluationCriterion) => {
    const docRef = doc(firestore, 'evaluationCriteria', criterion.id);
    setDocumentNonBlocking(docRef, { active: !criterion.active }, { merge: true });
    toast({
      title: 'Criterion Updated',
      description: `${criterion.name} is now ${!criterion.active ? 'active' : 'inactive'}.`,
    });
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
        const batch = writeBatch(firestore);
        
        // Delete all existing criteria
        initialCriteria.forEach(c => {
            const docRef = doc(firestore, 'evaluationCriteria', c.id);
            batch.delete(docRef);
        });

        // Add default criteria
        defaultCriteria.forEach(c => {
            const docRef = doc(firestore, 'evaluationCriteria', c.id);
            batch.set(docRef, c);
        });
        
        await batch.commit();

        toast({
            title: 'Criteria Reset',
            description: 'Evaluation criteria have been reset to the default set.',
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

  const criteria = initialCriteria.length > 0 ? initialCriteria : defaultCriteria;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Manage Evaluation Criteria</CardTitle>
                <CardDescription>
                Enable or disable judging categories for this event. Changes will reflect on the jury scoring form in real-time.
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
