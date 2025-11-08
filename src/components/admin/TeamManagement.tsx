'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Team } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface TeamManagementProps {
  teams: Team[];
  onDeleteRequest: (team: Team) => void;
}

export function TeamManagement({ teams, onDeleteRequest }: TeamManagementProps) {
    if (teams.length === 0) {
        return (
            <Card className="text-center p-8">
                <h3 className="text-lg font-semibold">No Teams Found</h3>
                <p className="text-muted-foreground">Upload teams or add a new one to get started.</p>
            </Card>
        );
    }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Teams</CardTitle>
        <CardDescription>
          Here you can view and delete existing teams.
        </CardDescription>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead className="text-right w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {teams.map((team) => (
                <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.teamName}</TableCell>
                    <TableCell>{team.projectName}</TableCell>
                    <TableCell className="text-right">
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onDeleteRequest(team)}>
                                <Trash2 className="h-4 w-4 text-destructive/70" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete Team</p>
                        </TooltipContent>
                        </Tooltip>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
      </Table>
    </Card>
  );
}
