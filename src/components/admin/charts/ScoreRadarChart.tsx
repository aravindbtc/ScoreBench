
'use client';

import {
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart,
  Legend,
  PolarRadiusAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { TeamScores, EvaluationCriterion } from '@/lib/types';
import { useMemo } from 'react';

interface ScoreRadarChartProps {
  scores: TeamScores;
  criteria: EvaluationCriterion[];
}

const chartConfig = {
    panel1: {
        label: 'Panel 1',
        color: 'hsl(var(--chart-1))',
    },
    panel2: {
        label: 'Panel 2',
        color: 'hsl(var(--chart-2))',
    },
    panel3: {
        label: 'Panel 3',
        color: 'hsl(var(--chart-3))',
    },
};

export function ScoreRadarChart({ scores, criteria: allCriteria }: ScoreRadarChartProps) {

  const { chartData, hasData } = useMemo(() => {
    // We only want to show criteria that are currently active and have been scored by at least one panel
    const activeScoredCriteria = allCriteria.filter(c => 
      c.active && (scores.panel1?.scores[c.id] || scores.panel2?.scores[c.id] || scores.panel3?.scores[c.id])
    );
    
    const data = activeScoredCriteria.map(criterion => {
      let dataPoint: {[key: string]: string | number} = { criterion: criterion.name };
      dataPoint.panel1 = scores.panel1?.scores[criterion.id] ?? 0;
      dataPoint.panel2 = scores.panel2?.scores[criterion.id] ?? 0;
      dataPoint.panel3 = scores.panel3?.scores[criterion.id] ?? 0;
      return dataPoint;
    });

    return { chartData: data, hasData: data.length > 0 };
  }, [scores, allCriteria]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
        <CardDescription>
          A visual comparison of scores from each panel across all active criteria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full max-h-[350px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="criterion" />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
            <PolarGrid />
            {scores.panel1 && <Radar name="Panel 1" dataKey="panel1" fill="var(--color-panel1)" fillOpacity={0.6} />}
            {scores.panel2 && <Radar name="Panel 2" dataKey="panel2" fill="var(--color-panel2)" fillOpacity={0.6} />}
            {scores.panel3 && <Radar name="Panel 3" dataKey="panel3" fill="var(--color-panel3)" fillOpacity={0.6} />}
            <Legend />
          </RadarChart>
        </ChartContainer>
        ) : (
            <div className="flex items-center justify-center h-[250px]">
                <p className="text-muted-foreground text-center">No scores submitted yet to display chart.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
