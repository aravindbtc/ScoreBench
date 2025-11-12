
'use client';

import { useMemo, useState } from 'react';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, TeamScores, CombinedScoreData, Jury } from '@/lib/types';
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
import { deleteTeam, deleteJury } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamManagement } from './TeamManagement';
import { JuryManagement } from './JuryManagement';
import { AddJuryDialog } from './AddJuryDialog';

export function AdminDashboard() {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddJuryOpen, setIsAddJuryOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'team' | 'jury', data: any} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const teamsQuery = useMemo(() => collection(db, 'teams'), []);
  const { data: teams, status: teamsStatus } = useFirestoreQuery<Team>(teamsQuery);

  const scoresQuery = useMemo(() => collection(db, 'scores'), []);
  const { data: scores, status: scoresStatus } = useFirestoreQuery<TeamScores>(scoresQuery);

  const juriesQuery = useMemo(() => collection(db, 'juries'), []);
  const { data: juries, status: juriesStatus } = useFirestoreQuery<Jury>(juriesQuery);

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
    
    let result;
    if (itemToDelete.type === 'team') {
      result = await deleteTeam(itemToDelete.data.id);
    } else {
      result = await deleteJury(itemToDelete.data.id);
    }
    
    if (result.success) {
      toast({
        title: `${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} Deleted`,
        description: result.message,
      });
    } else {
      toast({
        title: `Error Deleting ${itemToDelete.type}`,
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsDeleting(false);
    setItemToDelete(null);
  };

  const isLoading = teamsStatus === 'loading' || scoresStatus === 'loading' || juriesStatus === 'loading';

  return (
    <div className="space-y-4">
      <Tabs defaultValue="scores">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="scores">Leaderboard</TabsTrigger>
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

        <TabsContent value="scores" className="mt-4">
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
