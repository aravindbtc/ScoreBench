
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import type { Team, TeamScores, AppLabels, Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEvent } from '@/hooks/use-event';
import { useRouter } from 'next/navigation';

export function JuryDashboard() {
  const [juryPanel, setJuryPanel] = useState<number | null>(null);
  const firestore = useFirestore();
  const { eventId, isEventLoading } = useEvent();
  const router = useRouter();

  useEffect(() => {
    const panel = localStorage.getItem('juryPanel');
    if (panel) {
      setJuryPanel(parseInt(panel, 10));
    }
    if (!isEventLoading && !eventId) {
        router.push('/');
    }
  }, [eventId, isEventLoading, router]);

  const eventDocRef = useMemoFirebase(() => eventId ? doc(firestore, 'events', eventId) : null, [firestore, eventId]);
  const { data: eventData, isLoading: eventDocLoading } = useDoc<Event>(eventDocRef);

  const labelsDocRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'labels'), [firestore]);
  const { data: labelsData, isLoading: labelsLoading } = useDoc<AppLabels>(labelsDocRef);

  const labels = useMemo(() => ({
    teamLabel: labelsData?.teamLabel || 'Team Name',
    projectLabel: labelsData?.projectLabel || 'Project Name',
  }), [labelsData]);

  const teamsQuery = useMemoFirebase(() => eventId ? collection(firestore, `events/${eventId}/teams`) : null, [firestore, eventId]);
  const { data: teams, isLoading: teamsLoading } = useCollection<Team>(teamsQuery);

  const sortedTeams = useMemo(() => {
    if (!teams) return [];
    
    const naturalSort = (a: Team, b: Team) => {
        const re = /(\d+)/g;
        const aParts = a.teamName.split(re);
        const bParts = b.teamName.split(re);
    
        for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        const aPart = aParts[i];
        const bPart = bParts[i];
    
        if (i % 2 === 1) { // It's a number part
            const aNum = parseInt(aPart, 10);
            const bNum = parseInt(bPart, 10);
            if (aNum !== bNum) {
            return aNum - bNum;
            }
        } else { // It's a string part
            if (aPart !== bPart) {
            return aPart.localeCompare(bPart);
            }
        }
        }
        return a.teamName.length - b.teamName.length;
    };

    return [...teams].sort(naturalSort);
  }, [teams]);

  const scoresQuery = useMemoFirebase(() => eventId ? collection(firestore, `events/${eventId}/scores`) : null, [firestore, eventId]);
  const { data: scores, isLoading: scoresLoading } = useCollection<TeamScores>(scoresQuery);
  
  const getTeamStatus = (teamId: string) => {
    if (!scores || !juryPanel) return 'loading';
    const teamScore = scores.find(s => s.id === teamId);
    if (teamScore && teamScore[`panel${juryPanel}` as keyof TeamScores]) {
      return 'scored';
    }
    return 'pending';
  };

  const isLoading = isEventLoading || teamsLoading || scoresLoading || !juryPanel || labelsLoading || eventDocLoading;

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Team Evaluation: {eventData?.name}</CardTitle>
          <CardDescription>
            Select a team from the list to submit your scores. You are logged in as Panel {juryPanel}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">S.No.</TableHead>
                <TableHead>{labels.teamLabel}</TableHead>
                <TableHead>{labels.projectLabel}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams && sortedTeams.length > 0 ? (
                sortedTeams.map((team, index) => {
                  const status = getTeamStatus(team.id);
                  return (
                    <TableRow key={team.id}>
                      <TableCell>{index + 1}</TableCell>
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
                         <Button asChild variant="default" size="sm">
                           <Link href={`/jury/evaluate/${team.id}`}>
                             {status === 'scored' ? 'View Score' : 'Score Now'}
                             <ArrowRight className='ml-2 h-4 w-4' />
                           </Link>
                         </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No teams have been added to this event yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
