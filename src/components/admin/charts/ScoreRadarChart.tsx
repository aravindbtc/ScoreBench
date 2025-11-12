
'use client';

import {
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { TeamScores } from '@/lib/types';

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

  const criteria = ['innovation', 'relevance', 'technical', 'presentation', 'feasibility'];
  
  const chartData = criteria.map(criterion => {
    let dataPoint: {[key: string]: string | number} = { criterion };
    dataPoint.panel1 = scores.panel1?.[criterion as keyof typeof scores.panel1] ?? 0;
    dataPoint.panel2 = scores.panel2?.[criterion as keyof typeof scores.panel2] ?? 0;
    dataPoint.panel3 = scores.panel3?.[criterion as keyof typeof scores.panel3] ?? 0;
    return dataPoint;
  });

  const hasData = scores.panel1 || scores.panel2 || scores.panel3;

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
