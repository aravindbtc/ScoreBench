
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState, useMemo } from 'react';
import type { Team, TeamScores, EvaluationCriterion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';

// This function creates the validation schema dynamically based on the active criteria.
const createScoreSchema = (criteria: EvaluationCriterion[]) => {
  if (criteria.length === 0) {
    // If there are no criteria, the schema only requires remarks.
    return z.object({
      scores: z.object({}),
      remarks: z.string().min(10, 'Please provide some detailed remarks.'),
    });
  }

  const schemaObject = criteria.reduce((acc, criterion) => {
    acc[criterion.id] = z.number().min(1).max(10);
    return acc;
  }, {} as Record<string, z.ZodNumber>);

  return z.object({
    scores: z.object(schemaObject),
    remarks: z.string().min(10, 'Please provide some detailed remarks.'),
  });
};

type ScoreFormData = z.infer<ReturnType<typeof createScoreSchema>>;

interface ScoreFormProps {
  team: Team;
  juryPanel: number;
  existingScores: TeamScores | null;
}

export function ScoreForm({ team, juryPanel, existingScores }: ScoreFormProps) {
  const [totalScore, setTotalScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  // Fetch only the active evaluation criteria
  const criteriaQuery = useMemoFirebase(() => query(collection(firestore, 'evaluationCriteria'), where('active', '==', true)), [firestore]);
  const { data: activeCriteria, isLoading: criteriaLoading } = useCollection<EvaluationCriterion>(criteriaQuery);
  
  // Memoize the schema creation to avoid re-creating it on every render
  const scoreSchema = useMemo(() => {
    return activeCriteria ? createScoreSchema(activeCriteria) : createScoreSchema([]);
  }, [activeCriteria]);

  // Check if this panel has already submitted a score for this team
  const existingPanelScore = existingScores?.[`panel${juryPanel}` as keyof TeamScores];
  const isAlreadyScored = !!existingPanelScore;

  // Initialize the form
  const form = useForm<ScoreFormData>({
    resolver: zodResolver(scoreSchema),
    disabled: isAlreadyScored || isSubmitting,
  });

  // Effect to reset form values when criteria or team changes
  useEffect(() => {
    if (activeCriteria) {
      // If a score already exists, populate the form with those values
      if (isAlreadyScored && existingPanelScore) {
          form.reset({
              scores: existingPanelScore.scores,
              remarks: existingPanelScore.remarks,
          });
      } else {
        // Otherwise, set default values
        const defaultScores = activeCriteria.reduce((acc, c) => ({ ...acc, [c.id]: 5 }), {});
        form.reset({
          scores: defaultScores,
          remarks: '',
        });
      }
    }
  }, [activeCriteria, team, form, isAlreadyScored, existingPanelScore]);

  // Watch for changes in score values to calculate the total
  const watchedScores = form.watch('scores');
  useEffect(() => {
    if (watchedScores) {
      const sum = Object.values(watchedScores).reduce((acc, current) => acc + (current || 0), 0);
      setTotalScore(sum);
    }
  }, [watchedScores]);
  

  // Form Submission
  async function onSubmit(data: ScoreFormData) {
    if (!activeCriteria) return;
    setIsSubmitting(true);
    try {
      const maxScore = activeCriteria.length * 10;
      const scoreData = { ...data, total: totalScore, maxScore };
      const scoreDocRef = doc(firestore, 'scores', team.id);
      const panelField = `panel${juryPanel}`;

      // Set the score for the current panel
      await setDoc(scoreDocRef, { [panelField]: scoreData }, { merge: true });

      // Recalculate average after submission
      const updatedDocSnap = await getDoc(scoreDocRef);
      if (updatedDocSnap.exists()) {
        const docData = updatedDocSnap.data();
        let total = 0;
        let panelCount = 0;
        if (docData.panel1) { total += docData.panel1.total; panelCount++; }
        if (docData.panel2) { total += docData.panel2.total; panelCount++; }
        if (docData.panel3) { total += docData.panel3.total; panelCount++; }
        const avgScore = panelCount > 0 ? total / panelCount : 0;
        // Use non-blocking update for the average score
        setDocumentNonBlocking(scoreDocRef, { avgScore }, { merge: true });
      }

      toast({
        title: 'Success!',
        description: `Score submitted for ${team.teamName}.`,
      });

    } catch (error) {
       console.error('Error submitting score:', error);
       // Error will be caught by global listener
       setIsSubmitting(false);
    }
  }
  
  // Show a loading state while criteria are being fetched
  if (criteriaLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="m-auto my-8 h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // If a score has already been submitted for this team by this panel
  if (isAlreadyScored && !isSubmitting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation for: {team.teamName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg text-primary">
            You have already submitted your score for this team.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluating: {team.teamName}</CardTitle>
        <CardDescription>Project: {team.projectName}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {activeCriteria && activeCriteria.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {activeCriteria.map((criterion) => (
                  <FormField
                    key={criterion.id}
                    control={form.control}
                    name={`scores.${criterion.id}`}
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <div className="mb-2 flex justify-between items-center">
                          <FormLabel title={criterion.description}>{criterion.name}</FormLabel>
                          <span className="font-bold text-lg text-primary">{value}</span>
                        </div>
                        <FormControl>
                          <Slider
                            value={[value]}
                            onValueChange={(vals) => onChange(vals[0])}
                            min={1}
                            max={10}
                            step={1}
                            disabled={form.formState.disabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                  No active evaluation criteria have been set by the admin.
              </div>
            )}

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide your detailed feedback here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-lg border-t bg-muted/20 p-4">
             <div className="text-2xl font-bold">
              Total Score: <span className="text-primary">{totalScore} / {activeCriteria ? activeCriteria.length * 10 : 0}</span>
            </div>
            <Button type="submit" size="lg" disabled={form.formState.disabled || !form.formState.isValid}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Score'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
