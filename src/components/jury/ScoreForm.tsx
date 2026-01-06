
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState, useMemo } from 'react';
import type { Team, TeamScores, EvaluationCriterion, Score, AppLabels } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { useCollection, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { Input } from '../ui/input';
import { useEvent } from '@/hooks/use-event';
import { useRouter } from 'next/navigation';


const createScoreSchema = (criteria: EvaluationCriterion[]) => {
  const schemaObject = criteria.reduce((acc, criterion) => {
    acc[criterion.id] = z.coerce.number()
        .min(0, { message: "Must be 0 or more." })
        .max(criterion.maxScore, { message: `Score cannot exceed ${criterion.maxScore}.` });
    return acc;
  }, {} as Record<string, z.ZodTypeAny>);

  return z.object({
    scores: z.object(schemaObject),
    remarks: z.string().optional(),
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
    labels: { teamLabel: string, projectLabel: string };
    eventId: string;
}

function ScoreFormContent({ team, juryPanel, existingScores, activeCriteria, labels, eventId }: ScoreFormContentProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const existingPanelScore = useMemo(() => existingScores?.[`panel${juryPanel}` as keyof TeamScores] as Score | undefined, [existingScores, juryPanel]);
    
    const [isEditing, setIsEditing] = useState(!existingPanelScore);

    const scoreSchema = useMemo(() => createScoreSchema(activeCriteria), [activeCriteria]);
    const maxScorePossible = useMemo(() => activeCriteria.reduce((acc, c) => acc + c.maxScore, 0), [activeCriteria]);

    const defaultValues = useMemo(() => {
        const scores = activeCriteria.reduce((acc, criterion) => {
            const existingValue = existingPanelScore?.scores?.[criterion.id];
            acc[criterion.id] = existingValue !== undefined ? existingValue : 0;
            return acc;
        }, {} as {[key: string]: number});

        return {
            scores,
            remarks: existingPanelScore?.remarks ?? '',
        };
    }, [activeCriteria, existingPanelScore]);

    const form = useForm<ScoreFormData>({
        resolver: zodResolver(scoreSchema),
        defaultValues,
        mode: 'onChange'
    });
    
    useEffect(() => {
        form.reset(defaultValues);
        setIsEditing(!existingPanelScore);
    }, [defaultValues, existingPanelScore, form]);


    const watchedScores = form.watch('scores');
    
    const totalScore = useMemo(() => {
        if (!watchedScores) return 0;
        return Object.values(watchedScores).reduce((acc, current) => {
            return acc + (Number(current) || 0);
        }, 0);
    }, [watchedScores]);


    function onSubmit(data: ScoreFormData) {
        setIsSubmitting(true);
        
        const scoreDocRef = doc(firestore, `events/${eventId}/scores`, team.id);
        const panelField = `panel${juryPanel}`;

        const finalTotal = Object.values(data.scores).reduce((acc, current) => acc + (Number(current) || 0), 0);
        const panelScoreData: Score = { ...data, remarks: data.remarks || '', total: finalTotal, maxScore: maxScorePossible };

        const allPanelScores: (Score | undefined)[] = [
            juryPanel === 1 ? panelScoreData : existingScores?.panel1,
            juryPanel === 2 ? panelScoreData : existingScores?.panel2,
            juryPanel === 3 ? panelScoreData : existingScores?.panel3,
        ];

        const validScores = allPanelScores.filter((s): s is Score => s !== undefined && s.total !== undefined);
        
        const avgScore = validScores.length > 0 
            ? validScores.reduce((acc, s) => acc + (s.total / (s.maxScore || 1)) * 100, 0) / validScores.length
            : 0;
        
        const finalData = {
            [panelField]: panelScoreData,
            avgScore: avgScore
        };

        setDocumentNonBlocking(scoreDocRef, finalData, { merge: true });
        
        toast({
            title: 'Success!',
            description: `Score submitted for ${team.teamName}.`,
        });

        setIsEditing(false);
        setIsSubmitting(false);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Evaluating: {team.teamName}</CardTitle>
                <CardDescription>{labels.projectLabel}: {team.projectName}</CardDescription>
            </CardHeader>
            <Form {...form} key={team.id}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-8">
                        {activeCriteria.length > 0 ? (
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                                {activeCriteria.map((criterion) => (
                                    <FormField
                                        key={criterion.id}
                                        control={form.control}
                                        name={`scores.${criterion.id}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{criterion.name}</FormLabel>
                                                <FormDescription>{criterion.description}</FormDescription>
                                                <FormControl>
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={criterion.maxScore}
                                                            {...field}
                                                            disabled={!isEditing}
                                                            className="text-lg font-bold w-24"
                                                        />
                                                        <span className="text-muted-foreground">/ {criterion.maxScore}</span>
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
                                No active evaluation criteria have been set for this event.
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Provide your detailed feedback here... (Optional)" {...field} disabled={!isEditing}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-lg border-t bg-muted/20 p-4">
                        <div className="text-2xl font-bold">
                            Total Score: <span className="text-primary">{totalScore} / {maxScorePossible}</span>
                        </div>
                        {!isEditing ? (
                             <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-green-600">Score Submitted</span>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Score
                                </Button>
                            </div>
                        ) : (
                            <Button type="submit" size="lg" disabled={isSubmitting || !form.formState.isValid}>
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {isSubmitting ? 'Submitting...' : (existingPanelScore ? 'Update Score' : 'Submit Score')}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}


export function ScoreForm(props: ScoreFormProps) {
  const firestore = useFirestore();
  const { eventId, isEventLoading } = useEvent();
  const router = useRouter();

  useEffect(() => {
    if (!isEventLoading && !eventId) {
      router.push('/');
    }
  }, [eventId, isEventLoading, router]);

  const labelsDocRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'labels'), [firestore]);
  const { data: labelsData, isLoading: labelsLoading } = useDoc<AppLabels>(labelsDocRef);

  const labels = useMemo(() => ({
    teamLabel: labelsData?.teamLabel || 'Team Name',
    projectLabel: labelsData?.projectLabel || 'Project Name',
  }), [labelsData]);

  const criteriaQuery = useMemoFirebase(() => {
    if (!eventId) return null;
    return query(collection(firestore, `events/${eventId}/evaluationCriteria`), where('active', '==', true));
  }, [firestore, eventId]);
  const { data: activeCriteria, isLoading: criteriaLoading } = useCollection<EvaluationCriterion>(criteriaQuery);

  const isLoading = isEventLoading || criteriaLoading || labelsLoading || !activeCriteria || !eventId;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="m-auto my-8 h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return <ScoreFormContent {...props} activeCriteria={activeCriteria || []} labels={labels} eventId={eventId!} />;
}
