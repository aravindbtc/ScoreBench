'use client';

import { useMemo } from 'react';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, TeamScores, CombinedScoreData } from '@/lib/types';
import { ScoreTable } from './ScoreTable';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export function AdminDashboard() {
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
    });
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

  const isLoading = teamsStatus === 'loading' || scoresStatus === 'loading';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={isLoading || !combinedData.length}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ScoreTable data={combinedData} />
      )}
    </div>
  );
}
