
'use client';

import { useMemo, useState } from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import type { Team, TeamScores, CombinedScoreData, Jury } from '@/lib/types';
import { ScoreTable } from './ScoreTable';
import { Button } from '@/components/ui/button';
import { Download, Loader2, PlusCircle, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AddTeamDialog } from './AddTeamDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamManagement } from './TeamManagement';
import { JuryManagement } from './JuryManagement';
import { AddJuryDialog } from './AddJuryDialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { TopTeamsBarChart } from './charts/TopTeamsBarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export function AdminDashboard() {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddJuryOpen, setIsAddJuryOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'team' | 'jury', data: any} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const teamsQuery = useMemoFirebase(() => collection(firestore, 'teams'), [firestore]);
  const { data: teams, isLoading: teamsLoading } = useCollection<Team>(teamsQuery);

  const scoresQuery = useMemoFirebase(() => collection(firestore, 'scores'), [firestore]);
  const { data: scores, isLoading: scoresLoading } = useCollection<TeamScores>(scoresQuery);

  const juriesQuery = useMemoFirebase(() => collection(firestore, 'juries'), [firestore]);
  const { data: juries, isLoading: juriesLoading } = useCollection<Jury>(juriesQuery);

  const combinedData: CombinedScoreData[] = useMemo(() => {
    if (!teams || !scores) return [];
    return teams.map(team => {
      const teamScores = scores.find(s => s.id === team.id);
      return {
        ...team,
        scores: teamScores || { id: team.id },
      };
    }).sort((a, b) => (b.scores.avgScore ?? 0) - (a.scores.avgScore ?? 0));
  }, [teams, scores]);

  const handleExport = () => {
    const dataForExport = combinedData.map(item => ({
      'Team Name': item.teamName,
      'Project Name': item.projectName,
      'Panel 1 Score': item.scores.panel1?.total ?? 'N/A',
      'Panel 2 Score': item.scores.panel2?.total ?? 'N/A',
      'Panel 3 Score': item.scores.panel3?.total ?? 'N/A',
      'Average Score': item.scores.avgScore ? item.scores.avgScore.toFixed(2) : 'N/A',
      'Panel 1 Remarks': item.scores.panel1?.remarks ?? '',
      'Panel 2 Remarks': item.scores.panel2?.remarks ?? '',
      'Panel 3 Remarks': item.scores.panel3?.remarks ?? '',
      'Panel 1 AI Feedback': item.scores.panel1?.aiFeedback ?? '',
      'Panel 2 AI Feedback': item.scores.panel2?.aiFeedback ?? '',
      'Panel 3 AI Feedback': item.scores.panel3?.aiFeedback ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HackEval Scores');
    XLSX.writeFile(workbook, 'HackEval_Scores.xlsx');
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    
    try {
      if (itemToDelete.type === 'team') {
        const batch = writeBatch(firestore);
        const teamDocRef = doc(firestore, 'teams', itemToDelete.data.id);
        const scoreDocRef = doc(firestore, 'scores', itemToDelete.data.id);
        batch.delete(teamDocRef);
        batch.delete(scoreDocRef);
        await batch.commit();
      } else { // type is 'jury'
        const juryDocRef = doc(firestore, 'juries', itemToDelete.data.id);
        await writeBatch(firestore).delete(juryDocRef).commit();
      }
      
      toast({
        title: `${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} Deleted`,
        description: `Successfully deleted ${itemToDelete.data.teamName || itemToDelete.data.name}.`,
      });

    } catch (error) {
       console.error(`Error deleting ${itemToDelete.type}:`, error);
       // This will be caught and displayed by the global error handler
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const isLoading = teamsLoading || scoresLoading || juriesLoading;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="dashboard">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="teams">Team Management</TabsTrigger>
            <TabsTrigger value="juries">Jury Management</TabsTrigger>
          </TabsList>
           <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport} variant="outline" disabled={isLoading || !combinedData.length}>
              <Download className="mr-2 h-4 w-4" />
              Export Scores
            </Button>
          </div>
        </div>

        <TabsContent value="dashboard" className="mt-4">
           {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Teams</CardTitle>
                <CardDescription>Bar chart showing the average scores for the top 10 performing teams.</CardDescription>
              </CardHeader>
              <CardContent>
                <TopTeamsBarChart data={combinedData} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
           {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScoreTable data={combinedData} onDeleteRequest={(team) => setItemToDelete({type: 'team', data: team})} />
          )}
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="text-right mb-4">
                <Button onClick={() => setIsAddTeamOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Team
                </Button>
              </div>
              <TeamManagement teams={teams || []} onDeleteRequest={(team) => setItemToDelete({type: 'team', data: team as CombinedScoreData})} />
            </>
          )}
        </TabsContent>
         <TabsContent value="juries" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="text-right mb-4">
                <Button onClick={() => setIsAddJuryOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Jury
                </Button>
              </div>
              <JuryManagement juries={juries || []} onDeleteRequest={(jury) => setItemToDelete({type: 'jury', data: jury})} />
            </>
          )}
        </TabsContent>
      </Tabs>
      
      <AddTeamDialog isOpen={isAddTeamOpen} onOpenChange={setIsAddTeamOpen} />
      <AddJuryDialog isOpen={isAddJuryOpen} onOpenChange={setIsAddJuryOpen} />

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type}
              <strong className="text-foreground"> {itemToDelete?.data?.teamName || itemToDelete?.data?.name} </strong>
              {itemToDelete?.type === 'team' && 'and all associated scoring data.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
