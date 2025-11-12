
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { CombinedScoreData, Score, TeamScores } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Trash2, Wand2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { generateConsolidatedFeedback } from '@/ai/flows/generate-consolidated-feedback';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ScoreRadarChart } from './charts/ScoreRadarChart';

interface ScoreTableProps {
  data: CombinedScoreData[];
  onDeleteRequest: (team: CombinedScoreData) => void;
}

const PanelScoreDetails = ({ panelNo, score }: { panelNo: number, score?: Score }) => {
  if (!score) {
    return (
      <div className="p-4 text-sm text-center text-muted-foreground bg-muted/20 rounded-lg h-full flex items-center justify-center">Panel {panelNo}: No score submitted.</div>
    );
  }
  return (
    <Card className="bg-background/50 h-full">
        <CardHeader className="p-4">
            <CardTitle className="text-base">Panel {panelNo} Score: <span className="text-primary">{score.total}</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 text-sm">
            <div>
                <h4 className="font-semibold">Score Breakdown:</h4>
                <p className="text-muted-foreground">
                    Inn: {score.innovation}, Rel: {score.relevance}, Tech: {score.technical}, Pres: {score.presentation}, Feas: {score.feasibility}
                </p>
            </div>
             <div>
                <h4 className="font-semibold">Remarks:</h4>
                <p className="text-muted-foreground italic">"{score.remarks}"</p>
            </div>
             {score.aiFeedback && (
                <div>
                    <h4 className="font-semibold">AI Feedback:</h4>
                    <p className="text-muted-foreground italic">"{score.aiFeedback}"</p>
                </div>
            )}
        </CardContent>
    </Card>
  )
};

const ConsolidatedFeedback = ({ scores, teamId }: { scores: TeamScores, teamId: string }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateConsolidatedFeedback({
                panel1: scores.panel1,
                panel2: scores.panel2,
                panel3: scores.panel3,
            });
            if (result.feedback) {
                const scoreDocRef = doc(firestore, 'scores', teamId);
                setDocumentNonBlocking(scoreDocRef, { consolidatedFeedback: result.feedback }, { merge: true });
                toast({
                    title: 'Summary Generated!',
                    description: 'The consolidated AI summary has been created and saved.',
                });
            } else {
                throw new Error('No feedback was generated.');
            }
        } catch (error) {
            console.error("Failed to generate consolidated feedback", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: 'Generation Failed',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const hasAllPanels = scores.panel1 && scores.panel2 && scores.panel3;

    return (
        <Card className="col-span-1 md:col-span-2 bg-muted/30 border-dashed">
            <CardHeader>
                <CardTitle className="text-lg">Consolidated AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
                {scores.consolidatedFeedback ? (
                    <p className="text-muted-foreground italic">"{scores.consolidatedFeedback}"</p>
                ) : (
                    <div className='text-center py-4 space-y-3'>
                        <p className='text-sm text-muted-foreground'>{hasAllPanels ? "Click the button to generate a summary from all panel scores." : "A summary can be generated once all three panels have submitted their scores."}</p>
                        <Button onClick={handleGenerate} disabled={isGenerating || !hasAllPanels}>
                            {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                            Generate AI Summary
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export function ScoreTable({ data, onDeleteRequest }: ScoreTableProps) {
  if (data.length === 0) {
    return (
      <Card className="text-center p-8">
        <h3 className="text-lg font-semibold">No Teams Found</h3>
        <p className="text-muted-foreground">Add or upload teams via the Team Management tab.</p>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <p className="text-muted-foreground">Detailed scores for all participating teams.</p>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[40px]'></TableHead>
            <TableHead>Team Name</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead className="text-right w-[150px]">Average Score</TableHead>
            <TableHead className="text-right w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Accordion type="single" collapsible className="w-full">
            {data.map((item) => (
              <AccordionItem value={item.id} key={item.id} className="border-b-0">
                <TableRow>
                  <TableCell>
                    <AccordionTrigger className='p-0 [&[data-state=open]>svg]:text-primary'></AccordionTrigger>
                  </TableCell>
                  <TableCell className="font-medium">{item.teamName}</TableCell>
                  <TableCell>{item.projectName}</TableCell>
                  <TableCell className="text-right">
                    {item.scores.avgScore ? (
                      <Badge variant="secondary" className="text-lg font-bold text-primary">
                        {item.scores.avgScore.toFixed(2)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDeleteRequest(item); }}>
                          <Trash2 className="h-4 w-4 text-destructive/70" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Team</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                     <AccordionContent>
                      <div className="bg-muted/30 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PanelScoreDetails panelNo={1} score={item.scores.panel1} />
                            <PanelScoreDetails panelNo={2} score={item.scores.panel2} />
                            <PanelScoreDetails panelNo={3} score={item.scores.panel3} />
                        </div>
                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                            <ScoreRadarChart scores={item.scores} />
                        </div>
                        <ConsolidatedFeedback scores={item.scores} teamId={item.id} />
                      </div>
                    </AccordionContent>
                  </TableCell>
                </TableRow>
              </AccordionItem>
            ))}
          </Accordion>
        </TableBody>
      </Table>
    </Card>
  );
}
