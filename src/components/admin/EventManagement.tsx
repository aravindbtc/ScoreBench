
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, ArrowRight, Edit, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEvent } from '@/hooks/use-event';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteEvent } from '@/lib/actions';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

function CreateEventDialog({ onEventCreated }: { onEventCreated: () => void }) {
    const [eventName, setEventName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleCreate = async () => {
        if (!eventName.trim()) {
            toast({ title: "Event name is required.", variant: 'destructive'});
            return;
        }
        setIsCreating(true);
        try {
            await addDoc(collection(firestore, 'events'), {
                name: eventName,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Event Created', description: `"${eventName}" has been created.`});
            setEventName('');
            setIsOpen(false);
            onEventCreated();
        } catch (error) {
            console.error("Error creating event:", error);
            toast({ title: 'Error', description: 'Could not create event.', variant: 'destructive'});
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Event
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Event</DialogTitle>
                    <DialogDescription>
                        Give your new event a name. You can manage teams, juries, and scoring for it once it's created.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Input 
                        placeholder="e.g., Fall Hackathon 2024"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        disabled={isCreating}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EventCard({ event, onDeleteRequest }: { event: Event, onDeleteRequest: (event: Event) => void }) {
    const { setEventId } = useEvent();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [eventName, setEventName] = useState(event.name);
    const [isSaving, setIsSaving] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSelectEvent = () => {
        setEventId(event.id);
        router.push('/admin');
    }

    const handleSaveName = async () => {
        if (eventName.trim() === event.name) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            const eventRef = doc(firestore, 'events', event.id);
            await updateDoc(eventRef, { name: eventName });
            toast({ title: "Event Renamed", description: "The event name has been updated." });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to rename event:", error);
            toast({ title: "Error", description: "Could not rename the event.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Card className="flex flex-col">
             <CardContent className="p-4 flex items-center justify-between flex-grow gap-2">
                <div className="flex-grow min-w-0">
                    {isEditing ? (
                        <div className="flex-grow flex items-center gap-2">
                            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} disabled={isSaving} className="h-9" />
                            <Button size="icon" className="h-9 w-9" onClick={handleSaveName} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                             <h3 className="font-semibold truncate" title={event.name}>{event.name}</h3>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setIsEditing(true)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Edit Name</p></TooltipContent>
                             </Tooltip>
                        </div>
                    )}
                </div>
                 <div className="flex-shrink-0 flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive/80 hover:text-destructive" onClick={() => onDeleteRequest(event)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete Event</p></TooltipContent>
                    </Tooltip>
                    <Button onClick={handleSelectEvent} variant="secondary">
                        Manage <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


export function EventManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { eventId, setEventId } = useEvent();
    
    const eventsQuery = useMemoFirebase(() => collection(firestore, 'events'), [firestore]);
    const { data: events, isLoading } = useCollection<Event>(eventsQuery);
    const [displayEvents, setDisplayEvents] = useState<Event[]>([]);

    const [isCreatingDefault, setIsCreatingDefault] = useState(true);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (events) {
            const sorted = [...events].sort((a, b) => {
                const timeA = a.createdAt?.toDate?.().getTime() || 0;
                const timeB = b.createdAt?.toDate?.().getTime() || 0;
                return timeB - timeA;
            });
            setDisplayEvents(sorted);
        }
    }, [events]);

    const handleDelete = async () => {
        if (!eventToDelete) return;

        setIsDeleting(true);
        const result = await deleteEvent(eventToDelete.id);

        if (result.success) {
            toast({
                title: 'Event Deleted',
                description: `"${eventToDelete.name}" has been permanently removed.`,
            });
            // Update client-side state immediately
            setDisplayEvents(prevEvents => prevEvents.filter(e => e.id !== eventToDelete.id));
            if (eventId === eventToDelete.id) {
                setEventId(null);
            }
        } else {
            toast({
                title: 'Deletion Failed',
                description: result.message,
                variant: 'destructive',
                duration: 10000,
            });
        }

        setIsDeleting(false);
        setEventToDelete(null);
    }

    useEffect(() => {
        const setupDefaultEvent = async () => {
            if (!isLoading && events && events.length === 0) {
                try {
                    await addDoc(collection(firestore, 'events'), {
                        name: 'Unnamed Event',
                        createdAt: serverTimestamp(),
                    });
                    toast({
                        title: 'Default Event Created',
                        description: 'Your first event "Unnamed Event" is ready. Select it to start managing your competition.',
                    });
                } catch (error) {
                    console.error("Error creating default event:", error);
                    toast({ title: 'Error', description: 'Could not create the default event.', variant: 'destructive'});
                } finally {
                    setIsCreatingDefault(false);
                }
            } else if (!isLoading) {
                setIsCreatingDefault(false);
            }
        };

        setupDefaultEvent();
    }, [isLoading, events, firestore, toast]);


    const showLoadingState = isLoading || isCreatingDefault;

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
                    <p className="text-muted-foreground">Select an event to manage or create a new one.</p>
                </div>
                <CreateEventDialog onEventCreated={() => { /* The useCollection hook will update automatically */ }} />
             </div>
             
             {showLoadingState ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card><CardContent className="p-4 h-28 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
                    <Card><CardContent className="p-4 h-28 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
                </div>
             ) : displayEvents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayEvents.map(event => (
                        <EventCard key={event.id} event={event} onDeleteRequest={setEventToDelete} />
                    ))}
                </div>
             ) : (
                <Card className="text-center p-8 border-dashed">
                    <CardHeader>
                        <CardTitle>No Events Found</CardTitle>
                        <CardDescription>Get started by creating your first event.</CardDescription>
                    </CardHeader>
                </Card>
             )}

            <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the event
                    <strong className="text-foreground"> "{eventToDelete?.name}" </strong> 
                    and all associated data, including all teams, scores, juries, and criteria.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yes, Delete Event
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
