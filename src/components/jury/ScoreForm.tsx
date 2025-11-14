
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState, useMemo } from 'react';
import type { Team, TeamScores, EvaluationCriterion, Score } from '@/lib/types';
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
import { Loader2, Edit } from 'lucide-react';
import { doc, collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { Input } from '../ui/input';

const createScoreSchema = (criteria: EvaluationCriterion[]) => {
  const schemaObject = criteria.reduce((acc, criterion) => {
    acc[criterion.id] = z.coerce.number()
        .min(1, { message: "Must be at least 1." })
        .max(10, { message: "Must be 10 or less." });
    return acc;
  }, {} as Record<string, z.ZodTypeAny>);

  return z.object({
    scores: z.object(schemaObject),
    remarks: z.string(), // Remarks are optional
  });
};


type ScoreFormData = z.infer<ReturnType<typeof createScoreSchema>>;

interface ScoreFormProps {
  team: Team;
  juryPanel: number;
  existingScores: TeamScores | null;
}

interface ScoreFormContentProps extends ScoreFormProps {
    activeCriteria: EvaluationCriterion[];
}

function ScoreFormContent({ team, juryPanel, existingScores, activeCriteria }: ScoreFormContentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const existingPanelScore = useMemo(() => existingScores?.[`panel${juryPanel}` as keyof TeamScores] as Score | undefined, [existingScores, juryPanel]);
    
    // This state now controls whether the form is in "edit" or "view" mode.
    const [isEditing, setIsEditing] = useState(!existingPanelScore);
    const [totalScore, setTotalScore] = useState(0);

    const scoreSchema = useMemo(() => createScoreSchema(activeCriteria), [activeCriteria]);

    const defaultValues = useMemo(() => {
        const initialScore = existingPanelScore || {
            scores: activeCriteria.reduce((acc, c) => ({ ...acc, [c.id]: 5 }), {}),
            remarks: '',
        };

        const scoreValues = { ...initialScore.scores };
        // Ensure all active criteria have a default value
        activeCriteria.forEach(c => {
            if (scoreValues[c.id] === undefined) {
                scoreValues[c.id] = 5;
            }
        });

        return {
            scores: scoreValues,
            remarks: initialScore.remarks,
        };
    }, [activeCriteria, existingPanelScore]);

    const form = useForm<ScoreFormData>({
        resolver: zodResolver(scoreSchema),
        defaultValues,
    });
    
    // Watch scores to calculate total in real-time
    const watchedScores = form.watch('scores');
    useEffect(() => {
        if (watchedScores) {
            const sum = Object.values(watchedScores).reduce((acc, current) => acc + (Number(current) || 0), 0);
            setTotalScore(sum);
        } else {
             const sum = Object.values(defaultValues.scores).reduce((acc, current) => acc + (Number(current) || 0), 0);
             setTotalScore(sum);
        }
    }, [watchedScores, defaultValues.scores]);

    // Reset the form's default values if the underlying data changes
    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);


    function onSubmit(data: ScoreFormData) {
        setIsSubmitting(true);
        
        const scoreDocRef = doc(firestore, 'scores', team.id);
        const panelField = `panel${juryPanel}`;
        const maxScore = activeCriteria.length > 0 ? activeCriteria.length * 10 : 0;
        const panelScoreData: Score = { ...data, total: totalScore, maxScore };

        // 1. Prepare data for all panels to calculate average
        const allPanelScores: (Score | undefined)[] = [
            juryPanel === 1 ? panelScoreData : existingScores?.panel1,
            juryPanel === 2 ? panelScoreData : existingScores?.panel2,
            juryPanel === 3 ? panelScoreData : existingScores?.panel3,
        ];

        // 2. Calculate new average score
        const validScores = allPanelScores.filter((s): s is Score => s !== undefined && s.total !== undefined);
        const total = validScores.reduce((acc, s) => acc + s.total, 0);
        const avgScore = validScores.length > 0 ? total / validScores.length : 0;
        
        // 3. Create final data object for Firestore
        const finalData = {
            [panelField]: panelScoreData,
            avgScore: avgScore
        };

        // 4. Update document non-blockingly
        setDocumentNonBlocking(scoreDocRef, finalData, { merge: true });
        
        // 5. Provide immediate feedback to the user
        toast({
            title: 'Success!',
            description: `Score submitted for ${team.teamName}.`,
        });

        // 6. Disable the form and finalize UI state
        setIsEditing(false);
        setIsSubmitting(false);
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
                        {activeCriteria.length > 0 ? (
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                                {activeCriteria.map((criterion) => (
                                    <FormField
                                        key={criterion.id}
                                        control={form.control}
                                        name={`scores.${criterion.id}`}
                                        disabled={!isEditing}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel title={criterion.description}>{criterion.name}</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            {...field}
                                                            className="text-lg font-bold w-24"
                                                        />
                                                        <span className="text-muted-foreground">/ 10</span>
                                                    </div>
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
                            disabled={!isEditing}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks (Optional)</FormLabel>
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
                            Total Score: <span className="text-primary">{totalScore} / {activeCriteria.length * 10}</span>
                        </div>
                        {isEditing ? (
                            <Button type="submit" size="lg" disabled={isSubmitting || !form.formState.isValid}>
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {isSubmitting ? 'Submitting...' : (existingPanelScore ? 'Update Score' : 'Submit Score')}
                            </Button>
                        ) : (
                             <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-green-600">Score Submitted</span>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Score
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}


export function ScoreForm(props: ScoreFormProps) {
  const firestore = useFirestore();
  const criteriaQuery = useMemoFirebase(() => query(collection(firestore, 'evaluationCriteria'), where('active', '==', true)), [firestore]);
  const { data: activeCriteria, isLoading: criteriaLoading } = useCollection<EvaluationCriterion>(criteriaQuery);

  if (criteriaLoading || !activeCriteria) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="m-auto my-8 h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return <ScoreFormContent {...props} activeCriteria={activeCriteria} />
}
