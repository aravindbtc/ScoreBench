'use client';

import { useMemo, useState } from 'react';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, TeamScores, CombinedScoreData } from '@/lib/types';
import { ScoreTable } from './ScoreTable';
import { Button } from '@/components/ui/button';
import { Download, Loader2, PlusCircle, Trash2, UserPlus, Users } from 'lucide-react';
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
import { deleteTeam } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamManagement } from './TeamManagement';

export function AdminDashboard() {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<CombinedScoreData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const teamsQuery = useMemo(() => collection(db, 'teams'), []);
  const { data: teams, status: teamsStatus } = useFirestoreQuery<Team>(teamsQuery);

  const scoresQuery = useMemo(() => collection(db, 'scores'), []);
  const { data: scores, status: scoresStatus } = useFirestoreQuery<TeamScores>(scoresQuery);

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

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    setIsDeleting(true);
    const result = await deleteTeam(teamToDelete.id);
    if (result.success) {
      toast({
        title: 'Team Deleted',
        description: `Team "${teamToDelete.teamName}" has been successfully deleted.`,
      });
    } else {
      toast({
        title: 'Error Deleting Team',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsDeleting(false);
    setTeamToDelete(null);
  };

  const isLoading = teamsStatus === 'loading' || scoresStatus === 'loading';

  return (
    <div className="space-y-4">
      <Tabs defaultValue="scores">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="scores">Leaderboard</TabsTrigger>
            <TabsTrigger value="teams">Team Management</TabsTrigger>
          </TabsList>
           <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsAddTeamOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Team
            </Button>
            <Button onClick={handleExport} variant="outline" disabled={isLoading || !combinedData.length}>
              <Download className="mr-2 h-4 w-4" />
              Export Scores
            </Button>
          </div>
        </div>

        <TabsContent value="scores" className="mt-4">
           {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScoreTable data={combinedData} onDeleteRequest={setTeamToDelete} />
          )}
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
           {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TeamManagement teams={teams || []} onDeleteRequest={(team) => setTeamToDelete(team as CombinedScoreData)} />
          )}
        </TabsContent>
      </Tabs>
      
      <AddTeamDialog isOpen={isAddTeamOpen} onOpenChange={setIsAddTeamOpen} />

      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team
              <strong className="text-foreground"> {teamToDelete?.teamName} </strong>
              and all associated scoring data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
