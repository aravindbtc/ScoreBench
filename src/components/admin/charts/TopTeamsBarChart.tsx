
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { CombinedScoreData } from "@/lib/types"

interface TopTeamsBarChartProps {
  data: CombinedScoreData[];
}

export function TopTeamsBarChart({ data }: TopTeamsBarChartProps) {
  const topTeams = data
    .filter(team => team.scores.avgScore && team.scores.avgScore > 0)
    .slice(0, 10);
    
  const chartData = topTeams.map(team => ({
    teamName: team.teamName,
    avgScore: team.scores.avgScore ? parseFloat(team.scores.avgScore.toFixed(2)) : 0,
  }));

  const chartConfig = {
    avgScore: {
      label: "Average Score",
      color: "hsl(var(--primary))",
    },
  };

  if (chartData.length === 0) {
    return <p className="text-center text-muted-foreground">No scoring data available to display.</p>
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 30, // Increased top margin for labels
          right: 20,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="teamName"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 15) + (value.length > 15 ? '...' : '')}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={4}>
           <LabelList 
                dataKey="avgScore" 
                position="top" 
                offset={8} 
                className="fill-foreground"
                fontSize={12} 
            />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
