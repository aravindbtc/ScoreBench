
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Jury } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface JuryManagementProps {
  juries: Jury[];
  onDeleteRequest: (jury: Jury) => void;
}

export function JuryManagement({ juries, onDeleteRequest }: JuryManagementProps) {
  if (juries.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardHeader>
            <CardTitle>No Jury Panels Found</CardTitle>
            <CardDescription>Add a new jury panel for this event to get started.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Jury Panels</CardTitle>
        <CardDescription>
          Here you can view, add, and delete jury panels for the current event.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Panel Name</TableHead>
                <TableHead>Panel Number</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {juries.sort((a, b) => a.panelNo - b.panelNo).map((jury) => (
                <TableRow key={jury.id}>
                <TableCell className="font-medium">{jury.name}</TableCell>
                <TableCell>{jury.panelNo}</TableCell>
                <TableCell className='font-mono'>{jury.password}</TableCell>
                <TableCell className="text-right">
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteRequest(jury)}>
                        <Trash2 className="h-4 w-4 text-destructive/70" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Delete Jury</p>
                    </TooltipContent>
                    </Tooltip>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
