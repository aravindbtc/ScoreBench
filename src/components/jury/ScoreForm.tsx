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
import { generateTeamFeedback } from '@/ai/flows/generate-team-feedback';
import { Wand2, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';

// Schema is now generated dynamically
const createScoreSchema = (criteria: EvaluationCriterion[]) => {
  const schemaObject = criteria.reduce((acc, criterion) => {
    acc[criterion.id] = z.number().min(1).max(10);
    return acc;
  }, {} as Record<string, z.ZodNumber>);

  return z.object({
    scores: z.object(schemaObject),
    remarks: z.string().min(10, 'Please provide some detailed remarks.'),
    aiFeedback: z.string().optional(),
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
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const criteriaQuery = useMemoFirebase(() => query(collection(firestore, 'evaluationCriteria'), where('active', '==', true)), [firestore]);
  const { data: activeCriteria, isLoading: criteriaLoading } = useCollection<EvaluationCriterion>(criteriaQuery);
  
  const scoreSchema = useMemo(() => {
    return activeCriteria ? createScoreSchema(activeCriteria) : null;
  }, [activeCriteria]);

  const isAlreadyScored = !!existingScores?.[`panel${juryPanel}` as keyof TeamScores];

  const form = useForm<ScoreFormData>({
    resolver: scoreSchema ? zodResolver(scoreSchema) : undefined,
    disabled: isAlreadyScored || isSubmitting,
  });
  
  useEffect(() => {
    if (activeCriteria && scoreSchema) {
      form.reset({
        scores: activeCriteria.reduce((acc, c) => ({ ...acc, [c.id]: 5 }), {}),
        remarks: '',
        aiFeedback: '',
      });
      // @ts-ignore
      form.resolver = zodResolver(scoreSchema);
    }
  }, [activeCriteria, scoreSchema, form]);


  const watchedScores = form.watch('scores');

  useEffect(() => {
    if (watchedScores) {
      const sum = Object.values(watchedScores).reduce((acc, current) => acc + (current || 0), 0);
      setTotalScore(sum);
    }
  }, [watchedScores]);
  
  const handleGenerateFeedback = async () => {
    setIsGenerating(true);
    try {
      const { scores } = form.getValues();
      const input = activeCriteria?.reduce((acc, criterion) => {
        acc[criterion.name] = scores[criterion.id];
        return acc;
      }, {} as Record<string, number>) || {};

      const result = await generateTeamFeedback(input);
      if (result?.feedback) {
        form.setValue('aiFeedback', result.feedback);
        toast({
          title: 'AI Feedback Generated',
          description: 'The AI-powered feedback has been added to the form.',
        });
      }
    } catch (error) {
      console.error('AI feedback generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate AI feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  async function onSubmit(data: ScoreFormData) {
    if (!activeCriteria) return;
    setIsSubmitting(true);
    try {
      const maxScore = activeCriteria.length * 10;
      const scoreData = { ...data, total: totalScore, maxScore };
      const scoreDocRef = doc(firestore, 'scores', team.id);
      const panelField = `panel${juryPanel}`;

      await setDoc(scoreDocRef, { [panelField]: scoreData }, { merge: true });

      // Recalculate average
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
      // After submission, the form should become disabled.
      form.reset(form.getValues()); // Keep the values
      setIsSubmitting(false); // To let the disabled state be controlled by `isAlreadyScored` logic which will be true on next render

    } catch (error) {
       console.error('Error submitting score:', error);
       // This will be handled by the global error handler
       setIsSubmitting(false);
    }
  }
  
  if (criteriaLoading || !activeCriteria) {
    return <Card><CardContent><Loader2 className="m-auto my-8 h-8 w-8 animate-spin text-primary" /></CardContent></Card>
  }
  
  if (isAlreadyScored) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation for: {team.teamName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg text-green-400">
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
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {activeCriteria && activeCriteria.map((criterion) => (
                <FormField
                  key={criterion.id}
                  control={form.control}
                  name={`scores.${criterion.id}` as any}
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
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>AI-Powered Feedback</FormLabel>
                <Button type="button" size="sm" variant="outline" onClick={handleGenerateFeedback} disabled={isGenerating || form.formState.disabled}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </div>
               <FormField
                control={form.control}
                name="aiFeedback"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Click 'Generate' to create AI-powered feedback..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-lg border-t bg-card-foreground/5 p-4">
             <div className="text-2xl font-bold">
              Total Score: <span className="text-primary">{totalScore} / {activeCriteria ? activeCriteria.length * 10 : 0}</span>
            </div>
            <Button type="submit" size="lg" disabled={form.formState.disabled || !form.formState.isValid}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Score
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
