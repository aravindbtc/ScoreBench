
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection } from 'firebase/firestore';
import type { Team, TeamScores } from '@/lib/types';
import { ScoreForm } from './ScoreForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function JuryDashboard() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [juryPanel, setJuryPanel] = useState<number | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const panel = localStorage.getItem('juryPanel');
    if (panel) {
      setJuryPanel(parseInt(panel, 10));
    }
  }, []);

  const teamsQuery = useMemoFirebase(() => collection(firestore, 'teams'), [firestore]);
  const { data: teams, isLoading: teamsLoading } = useCollection<Team>(teamsQuery);

  const scoresQuery = useMemoFirebase(() => collection(firestore, 'scores'), [firestore]);
  const { data: scores, isLoading: scoresLoading } = useCollection<TeamScores>(scoresQuery);

  const selectedTeam = useMemo(() => {
    return teams?.find((t) => t.id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);
  
  const selectedTeamScore = useMemo(() => {
    return scores?.find((s) => s.id === selectedTeamId) || null;
  }, [scores, selectedTeamId]);
  
  const getTeamStatus = (teamId: string) => {
    if (!scores || !juryPanel) return 'loading';
    const teamScore = scores.find(s => s.id === teamId);
    if (teamScore && teamScore[`panel${juryPanel}` as keyof TeamScores]) {
      return 'scored';
    }
    return 'pending';
  };

  const isLoading = teamsLoading || scoresLoading || !juryPanel;

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Team Evaluation</CardTitle>
          <CardDescription>
            Select a team from the list to submit your scores. You are logged in as Panel {juryPanel}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams && teams.length > 0 ? (
                teams.map((team) => {
                  const status = getTeamStatus(team.id);
                  const isSelected = team.id === selectedTeamId;
                  return (
                    <TableRow key={team.id} className={isSelected ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell>{team.projectName}</TableCell>
                      <TableCell>
                        {status === 'scored' ? (
                           <Badge variant="secondary">Scored</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                         <Button 
                            variant={isSelected ? "secondary" : "default"}
                            size="sm" 
                            onClick={() => setSelectedTeamId(team.id)}
                          >
                          {status === 'scored' ? 'View Score' : 'Score Now'}
                         </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No teams have been added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedTeam && juryPanel && (
        <ScoreForm 
          key={selectedTeam.id}
          team={selectedTeam} 
          juryPanel={juryPanel} 
          existingScores={selectedTeamScore}
        />
      )}
    </div>
  );
}
