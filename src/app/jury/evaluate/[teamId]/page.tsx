
'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import type { Team, TeamScores } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { ScoreForm } from '@/components/jury/ScoreForm';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EvaluateTeamPage({ params }: { params: { teamId: string } }) {
  const [juryPanel, setJuryPanel] = useState<number | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const panel = localStorage.getItem('juryPanel');
    if (panel) {
      setJuryPanel(parseInt(panel, 10));
    }
  }, []);

  const teamRef = useMemoFirebase(() => doc(firestore, 'teams', params.teamId), [firestore, params.teamId]);
  const { data: team, isLoading: teamLoading } = useDoc<Team>(teamRef);

  const scoreRef = useMemoFirebase(() => doc(firestore, 'scores', params.teamId), [firestore, params.teamId]);
  const { data: existingScores, isLoading: scoreLoading } = useDoc<TeamScores>(scoreRef);

  const isLoading = teamLoading || scoreLoading || !juryPanel || !team;

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/jury">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
       </Button>
       
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ScoreForm 
          key={team.id}
          team={team} 
          juryPanel={juryPanel!} 
          existingScores={existingScores}
        />
      )}
    </div>
  );
}
