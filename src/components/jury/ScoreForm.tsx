
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { Input } from '../ui/input';

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
    // Use coerce to handle number conversion from input fields
    acc[criterion.id] = z.coerce.number()
        .min(1, { message: "Must be at least 1." })
        .max(10, { message: "Must be 10 or less." });
    return acc;
  }, {} as Record<string, z.ZodTypeAny>);

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

  const criteriaQuery = useMemoFirebase(() => query(collection(firestore, 'evaluationCriteria'), where('active', '==', true)), [firestore]);
  const { data: activeCriteria, isLoading: criteriaLoading } = useCollection<EvaluationCriterion>(criteriaQuery);
  
  const scoreSchema = useMemo(() => {
    return activeCriteria ? createScoreSchema(activeCriteria) : createScoreSchema([]);
  }, [activeCriteria]);

  const existingPanelScore = existingScores?.[`panel${juryPanel}` as keyof TeamScores];
  const isAlreadyScored = !!existingPanelScore;

  const form = useForm<ScoreFormData>({
    resolver: zodResolver(scoreSchema),
    disabled: isAlreadyScored || isSubmitting,
  });

  useEffect(() => {
    let defaultValues;
    if (activeCriteria) {
      if (isAlreadyScored && existingPanelScore) {
        defaultValues = {
          scores: existingPanelScore.scores,
          remarks: existingPanelScore.remarks,
        };
      } else {
        const defaultScores = activeCriteria.reduce((acc, c) => ({ ...acc, [c.id]: 5 }), {});
        defaultValues = {
          scores: defaultScores,
          remarks: '',
        };
      }
    } else {
      defaultValues = { scores: {}, remarks: '' };
    }
    form.reset(defaultValues);
  }, [activeCriteria, isAlreadyScored, existingPanelScore, form]);

  const watchedScores = form.watch('scores');
  useEffect(() => {
    if (watchedScores) {
      const sum = Object.values(watchedScores).reduce((acc, current) => acc + (Number(current) || 0), 0);
      setTotalScore(sum);
    }
  }, [watchedScores]);

  async function onSubmit(data: ScoreFormData) {
    if (!activeCriteria) return;
    setIsSubmitting(true);
    try {
      const maxScore = activeCriteria.length * 10;
      const scoreData = { ...data, total: totalScore, maxScore };
      const scoreDocRef = doc(firestore, 'scores', team.id);
      const panelField = `panel${juryPanel}`;

      await setDoc(scoreDocRef, { [panelField]: scoreData }, { merge: true });

      const updatedDocSnap = await getDoc(scoreDocRef);
      if (updatedDocSnap.exists()) {
        const docData = updatedDocSnap.data();
        let total = 0;
        let panelCount = 0;
        if (docData.panel1) { total += docData.panel1.total; panelCount++; }
        if (docData.panel2) { total += docData.panel2.total; panelCount++; }
        if (docData.panel3) { total += docData.panel3.total; panelCount++; }
        const avgScore = panelCount > 0 ? total / panelCount : 0;
        setDocumentNonBlocking(scoreDocRef, { avgScore }, { merge: true });
      }

      toast({
        title: 'Success!',
        description: `Score submitted for ${team.teamName}.`,
      });

    } catch (error) {
       console.error('Error submitting score:', error);
       setIsSubmitting(false);
    }
  }
  
  if (criteriaLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="m-auto my-8 h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
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
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                {activeCriteria.map((criterion) => (
                  <FormField
                    key={criterion.id}
                    control={form.control}
                    name={`scores.${criterion.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel title={criterion.description}>{criterion.name}</FormLabel>
                        <FormControl>
                           <Input
                            type="number"
                            min="1"
                            max="10"
                            {...field}
                            className="text-lg font-bold w-24"
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
