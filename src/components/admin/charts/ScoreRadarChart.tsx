
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
import type { TeamScores } from '@/lib/types';
import { useMemo } from 'react';

interface ScoreRadarChartProps {
  scores: TeamScores;
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

export function ScoreRadarChart({ scores }: ScoreRadarChartProps) {

  const { chartData, hasData } = useMemo(() => {
    const allCriteria = new Set<string>();
    if (scores.panel1) Object.keys(scores.panel1.scores).forEach(c => allCriteria.add(c));
    if (scores.panel2) Object.keys(scores.panel2.scores).forEach(c => allCriteria.add(c));
    if (scores.panel3) Object.keys(scores.panel3.scores).forEach(c => allCriteria.add(c));

    const criteria = Array.from(allCriteria);
    
    const data = criteria.map(criterion => {
      let dataPoint: {[key: string]: string | number} = { criterion: criterion.charAt(0).toUpperCase() + criterion.slice(1) };
      dataPoint.panel1 = scores.panel1?.scores[criterion] ?? 0;
      dataPoint.panel2 = scores.panel2?.scores[criterion] ?? 0;
      dataPoint.panel3 = scores.panel3?.scores[criterion] ?? 0;
      return dataPoint;
    });

    return { chartData: data, hasData: data.length > 0 && (scores.panel1 || scores.panel2 || scores.panel3) };
  }, [scores]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
        <CardDescription>
          A visual comparison of scores from each panel across all criteria.
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
