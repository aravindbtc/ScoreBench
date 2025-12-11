
'use client';

import { useState, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { Team, TeamScores } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { ScoreForm } from '@/components/jury/ScoreForm';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useAuthListener } from '@/hooks/use-auth-listener';
import { useEvent } from '@/hooks/use-event';

export default function EvaluateTeamPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { user, isLoading: isAuthLoading } = useAuthListener('/jury');
  const { eventId, isEventLoading } = useEvent();

  const [juryPanel, setJuryPanel] = useState<number | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const panel = localStorage.getItem('juryPanel');
    if (panel) {
      setJuryPanel(parseInt(panel, 10));
    }
  }, []);

  const teamRef = useMemoFirebase(() => {
    if (!user || !teamId || !eventId) return null;
    return doc(firestore, `events/${eventId}/teams`, teamId);
  }, [firestore, eventId, teamId, user]);
  const { data: team, isLoading: teamLoading } = useDoc<Team>(teamRef);

  const scoreRef = useMemoFirebase(() => {
    if (!user || !teamId || !eventId) return null;
    return doc(firestore, `events/${eventId}/scores`, teamId);
  }, [firestore, eventId, teamId, user]);
  const { data: existingScores, isLoading: scoreLoading } = useDoc<TeamScores>(scoreRef);

  const isLoading = isAuthLoading || isEventLoading || teamLoading || scoreLoading || !juryPanel || !team;

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
