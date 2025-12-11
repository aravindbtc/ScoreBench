
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, ArrowRight, Edit, Check } from 'lucide-react';
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

function CreateEventDialog({ onEventCreated }: { onEventCreated: () => void }) {
    const [eventName, setEventName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
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
            onEventCreated();
        } catch (error) {
            console.error("Error creating event:", error);
            toast({ title: 'Error', description: 'Could not create event.', variant: 'destructive'});
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog onOpenChange={(isOpen) => !isOpen && onEventCreated()}>
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

function EventCard({ event }: { event: Event }) {
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
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                {isEditing ? (
                    <div className="flex-grow flex items-center gap-2">
                        <Input value={eventName} onChange={(e) => setEventName(e.target.value)} disabled={isSaving} />
                        <Button size="icon" onClick={handleSaveName} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                         <h3 className="font-semibold">{event.name}</h3>
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <Button onClick={handleSelectEvent} variant="secondary">
                    Manage <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}


export function EventManagement() {
    const firestore = useFirestore();
    const [dialogOpen, setDialogOpen] = useState(false);
    
    const eventsQuery = useMemoFirebase(() => collection(firestore, 'events'), [firestore]);
    const { data: events, isLoading } = useCollection<Event>(eventsQuery);

    const sortedEvents = useMemo(() => {
        if (!events) return [];
        return [...events].sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    }, [events]);

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
                    <p className="text-muted-foreground">Select an event to manage or create a new one.</p>
                </div>
                <CreateEventDialog onEventCreated={() => setDialogOpen(false)} />
             </div>
             
             {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card><CardContent className="p-4 h-20 animate-pulse bg-muted"></CardContent></Card>
                    <Card><CardContent className="p-4 h-20 animate-pulse bg-muted"></CardContent></Card>
                </div>
             ) : sortedEvents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sortedEvents.map(event => (
                        <EventCard key={event.id} event={event} />
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
        </div>
    );
}
