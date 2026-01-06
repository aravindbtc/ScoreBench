
'use client';

import { useMemo, useState } from 'react';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import type { Team, TeamScores, CombinedScoreData, Jury, EvaluationCriterion, AppLabels, Score, Event } from '@/lib/types';
import { ScoreTable } from './ScoreTable';
import { Button } from '@/components/ui/button';
import { Download, Loader2, PlusCircle, UserPlus, Trash2 } from 'lucide-react';
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
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { TopTeamsBarChart } from './charts/TopTeamsBarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useEvent } from '@/hooks/use-event';

export function AdminDashboard() {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddJuryOpen, setIsAddJuryOpen] = useState(false);
  const [isManageCriteriaOpen, setIsManageCriteriaOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'team' | 'jury', data: any} | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { eventId, isEventLoading } = useEvent();

  const eventDocRef = useMemoFirebase(() => eventId ? doc(firestore, 'events', eventId) : null, [firestore, eventId]);
  const { data: eventData } = useDoc<Event>(eventDocRef);

  const labelsDocRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'labels'), [firestore]);
  const { data: labelsData, isLoading: labelsLoading } = useDoc<AppLabels>(labelsDocRef);

  const labels = useMemo(() => ({
    teamLabel: labelsData?.teamLabel || 'Team Name',
    projectLabel: labelsData?.projectLabel || 'Project Name',
  }), [labelsData]);


  const teamsQuery = useMemoFirebase(() => eventId ? collection(firestore, `events/${eventId}/teams`) : null, [firestore, eventId]);
  const { data: teams, isLoading: teamsLoading } = useCollection<Team>(teamsQuery);

  const scoresQuery = useMemoFirebase(() => eventId ? collection(firestore, `events/${eventId}/scores`) : null, [firestore, eventId]);
  const { data: scores, isLoading: scoresLoading } = useCollection<TeamScores>(scoresQuery);

  const juriesQuery = useMemoFirebase(() => eventId ? collection(firestore, `events/${eventId}/juries`) : null, [firestore, eventId]);
  const { data: juries, isLoading: juriesLoading } = useCollection<Jury>(juriesQuery);
  
  const criteriaQuery = useMemoFirebase(() => eventId ? collection(firestore, `events/${eventId}/evaluationCriteria`) : null, [firestore, eventId]);
  const { data: criteria, isLoading: criteriaLoading } = useCollection<EvaluationCriterion>(criteriaQuery);


  const combinedData: CombinedScoreData[] = useMemo(() => {
    if (!teams || !scores) return [];

    return teams.map(team => {
        const teamScores = scores.find(s => s.id === team.id) || { id: team.id };
        
        const allPanelScores: (Score | undefined)[] = [
            teamScores.panel1,
            teamScores.panel2,
            teamScores.panel3,
        ];

        const validScores = allPanelScores.filter((s): s is Score => s !== undefined && typeof s.total === 'number');

        const calculatedAvgScore = validScores.length > 0
            ? validScores.reduce((acc, s) => acc + s.total, 0) / validScores.length
            : 0;

        return {
            ...team,
            scores: {
                ...teamScores,
                avgScore: calculatedAvgScore > 0 ? calculatedAvgScore : undefined,
            }
        };
    }).sort((a, b) => (b.scores.avgScore ?? 0) - (a.scores.avgScore ?? 0));
  }, [teams, scores]);

  const handleExport = async () => {
    if (!eventId) return;
    const criteriaSnapshot = await getDocs(collection(firestore, `events/${eventId}/evaluationCriteria`));
    const allCriteria = criteriaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<EvaluationCriterion, 'id'> }));
    
    const dataForExport = combinedData.map(item => {
      const row: {[key: string]: any} = {
        [labels.teamLabel]: item.teamName,
        [labels.projectLabel]: item.projectName,
        'Average Score': item.scores.avgScore ? item.scores.avgScore.toFixed(2) : 'N/A',
      };
      
      for(let i = 1; i <= 3; i++) {
        const panelKey = `panel${i}` as keyof TeamScores;
        const panel = item.scores[panelKey] as Score | undefined;
        row[`Panel ${i} Total Score`] = panel?.total ?? 'N/A';
        if(panel?.scores) {
            for (const criterion of allCriteria) {
                row[`P${i} ${criterion.name}`] = panel?.scores[criterion.id] ?? 'N/A';
            }
        }
        row[`Panel ${i} Remarks`] = panel?.remarks ?? '';
        row[`Panel ${i} AI Feedback`] = panel?.aiFeedback ?? '';
      }
      row['Consolidated Feedback'] = item.scores.consolidatedFeedback ?? '';

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ScoreBench Scores');
    XLSX.writeFile(workbook, 'ScoreBench_Scores.xlsx');
  };

  const handleDelete = async () => {
    if (!itemToDelete || !eventId) return;
    setIsDeleting(true);
    
    try {
      const batch = writeBatch(firestore);
      if (itemToDelete.type === 'team') {
        const teamDocRef = doc(firestore, `events/${eventId}/teams`, itemToDelete.data.id);
        const scoreDocRef = doc(firestore, `events/${eventId}/scores`, itemToDelete.data.id);
        batch.delete(teamDocRef);
        batch.delete(scoreDocRef);
      } else { // type is 'jury'
        const juryDocRef = doc(firestore, `events/${eventId}/juries`, itemToDelete.data.id);
        batch.delete(juryDocRef);
      }
      await batch.commit();
      
      toast({
        title: `${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} Deleted`,
        description: `Successfully deleted ${itemToDelete.data.teamName || itemToDelete.data.name}.`,
      });

    } catch (error) {
       console.error(`Error deleting ${itemToDelete.type}:`, error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteAllTeams = async () => {
    if (!eventId || !teamsQuery || !scoresQuery) return;
    setIsDeleting(true);
    try {
        const batch = writeBatch(firestore);
        
        const teamsSnapshot = await getDocs(teamsQuery);
        const scoresSnapshot = await getDocs(scoresQuery);

        teamsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        scoresSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        
        toast({
            title: 'All Teams Deleted',
            description: 'All teams and their associated scores have been permanently removed from this event.',
        });
    } catch (error) {
        console.error('Error deleting all teams:', error);
        toast({
            title: 'Deletion Failed',
            description: 'Could not delete all teams. Check the console for details.',
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteAllOpen(false);
    }
};

  const isLoading = isEventLoading || teamsLoading || scoresLoading || juriesLoading || criteriaLoading || labelsLoading;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-muted-foreground">Event: <span className="text-foreground">{eventData?.name}</span></h2>
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
            <ScoreTable data={combinedData} onDeleteRequest={(team) => setItemToDelete({type: 'team', data: team})} criteria={criteria || []} labels={labels}/>
          )}
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline" disabled={!teams || teams.length === 0} onClick={() => setIsDeleteAllOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Teams
                </Button>
                <Button onClick={() => setIsAddTeamOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Team
                </Button>
              </div>
              <TeamManagement teams={teams || []} onDeleteRequest={(team) => setItemToDelete({type: 'team', data: team as CombinedScoreData})} labels={labels}/>
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
      
      <AddTeamDialog isOpen={isAddTeamOpen} onOpenChange={setIsAddTeamOpen} labels={labels}/>
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

      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete all teams?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action is irreversible. It will permanently delete <strong className="text-foreground">{teams?.length || 0} teams</strong> and all of their scoring data from this event.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllTeams} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yes, Delete All Teams
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
