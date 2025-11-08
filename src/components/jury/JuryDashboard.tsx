'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, TeamScores } from '@/lib/types';
import { ScoreForm } from './ScoreForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function JuryDashboard() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [juryPanel, setJuryPanel] = useState<number | null>(null);

  useEffect(() => {
    const panel = localStorage.getItem('juryPanel');
    if (panel) {
      setJuryPanel(parseInt(panel, 10));
    }
  }, []);

  const teamsQuery = useMemo(() => collection(db, 'teams'), []);
  const { data: teams, status: teamsStatus } = useFirestoreQuery<Team>(teamsQuery);

  const scoresQuery = useMemo(() => collection(db, 'scores'), []);
  const { data: scores, status: scoresStatus } = useFirestoreQuery<TeamScores>(scoresQuery);

  const selectedTeam = useMemo(() => {
    return teams?.find((t) => t.id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);
  
  const selectedTeamScore = useMemo(() => {
    return scores?.find((s) => s.id === selectedTeamId) || null;
  }, [scores, selectedTeamId]);


  if (teamsStatus === 'loading' || scoresStatus === 'loading' || !juryPanel) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
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
            Select a team from the dropdown to submit your scores. Your are logged in as Panel {juryPanel}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Select onValueChange={setSelectedTeamId} value={selectedTeamId ?? ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team to evaluate..." />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.teamName} - <span className="text-muted-foreground">{team.projectName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
