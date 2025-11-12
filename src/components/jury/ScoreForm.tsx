'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import type { Team, TeamScores } from '@/lib/types';
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const scoreSchema = z.object({
  innovation: z.number().min(1).max(10),
  relevance: z.number().min(1).max(10),
  technical: z.number().min(1).max(10),
  presentation: z.number().min(1).max(10),
  feasibility: z.number().min(1).max(10),
  remarks: z.string().min(10, 'Please provide some detailed remarks.'),
  aiFeedback: z.string().optional(),
});

type ScoreFormData = z.infer<typeof scoreSchema>;

interface ScoreFormProps {
  team: Team;
  juryPanel: number;
  existingScores: TeamScores | null;
}

export function ScoreForm({ team, juryPanel, existingScores }: ScoreFormProps) {
  const [totalScore, setTotalScore] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const isAlreadyScored = !!existingScores?.[`panel${juryPanel}` as keyof TeamScores];

  const form = useForm<ScoreFormData>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      innovation: 5,
      relevance: 5,
      technical: 5,
      presentation: 5,
      feasibility: 5,
      remarks: '',
      aiFeedback: '',
    },
    disabled: isAlreadyScored || isSubmitting,
  });

  const watchedScores = form.watch(['innovation', 'relevance', 'technical', 'presentation', 'feasibility']);

  useEffect(() => {
    const sum = watchedScores.reduce((acc, current) => acc + (current || 0), 0);
    setTotalScore(sum);
  }, [watchedScores]);

  const handleGenerateFeedback = async () => {
    setIsGenerating(true);
    try {
      const scores = form.getValues();
      const result = await generateTeamFeedback({
        innovation: scores.innovation,
        relevance: scores.relevance,
        technical: scores.technical,
        presentation: scores.presentation,
        feasibility: scores.feasibility,
      });
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
    setIsSubmitting(true);
    try {
      const scoreData = { ...data, total: totalScore };
      const scoreDocRef = doc(firestore, 'scores', team.id);
      const panelField = `panel${juryPanel}`;

      await setDoc(scoreDocRef, { [panelField]: scoreData }, { merge: true });

      // Recalculate average
      const updatedDocSnap = await getDoc(scoreDocRef);
      if (updatedDocSnap.exists()) {
        const data = updatedDocSnap.data();
        let total = 0;
        let panelCount = 0;
        if (data.panel1) { total += data.panel1.total; panelCount++; }
        if (data.panel2) { total += data.panel2.total; panelCount++; }
        if (data.panel3) { total += data.panel3.total; panelCount++; }
        const avgScore = panelCount > 0 ? total / panelCount : 0;
        await setDoc(scoreDocRef, { avgScore }, { merge: true });
      }

      toast({
        title: 'Success!',
        description: `Score submitted for ${team.teamName}.`,
      });
    } catch (error) {
       console.error('Error submitting score:', error);
       // This will be handled by the global error handler
    }
    setIsSubmitting(false);
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

  const scoreFields: { name: keyof ScoreFormData, label: string }[] = [
    { name: 'innovation', label: 'Innovation / Novelty' },
    { name: 'relevance', label: 'Problem Relevance' },
    { name: 'technical', label: 'Technical Implementation' },
    { name: 'presentation', label: 'Presentation & Communication' },
    { name: 'feasibility', label: 'Scalability & Feasibility' },
  ];

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
              {scoreFields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name as "innovation" | "relevance" | "technical" | "presentation" | "feasibility"}
                  render={({ field: { value, onChange } }) => (
                    <FormItem>
                      <div className="mb-2 flex justify-between items-center">
                        <FormLabel>{field.label}</FormLabel>
                        <span className="font-bold text-lg text-primary">{value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          defaultValue={[value]}
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
              Total Score: <span className="text-primary">{totalScore} / 50</span>
            </div>
            <Button type="submit" size="lg" disabled={form.formState.disabled}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Score
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
