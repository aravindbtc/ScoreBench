
'use client';

import { useState } from 'react';
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
import { Edit, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { EditTeamDialog } from './EditTeamDialog';

interface TeamManagementProps {
  teams: Team[];
  onDeleteRequest: (team: Team) => void;
}

export function TeamManagement({ teams, onDeleteRequest }: TeamManagementProps) {
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (team: Team) => {
    setTeamToEdit(team);
    setIsEditDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setTeamToEdit(null);
    }
  };

  if (teams.length === 0) {
    return (
      <Card className="text-center p-8">
        <h3 className="text-lg font-semibold">No Teams Found</h3>
        <p className="text-muted-foreground">Upload teams or add a new one to get started.</p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Teams</CardTitle>
          <CardDescription>
            Here you can view, edit, and delete existing teams. Team scores are managed on the Leaderboard tab.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
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
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(team)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Team</p>
                    </TooltipContent>
                  </Tooltip>
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
      <EditTeamDialog
        team={teamToEdit}
        isOpen={isEditDialogOpen}
        onOpenChange={handleDialogChange}
      />
    </>
  );
}
