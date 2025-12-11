'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Event } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useEvent } from '@/hooks/use-event';

export function JuryLogin() {
  const router = useRouter();
  const firestore = useFirestore();
  const { setEventId } = useEvent();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const eventsQuery = useMemoFirebase(() => collection(firestore, 'events'), [firestore]);
  const { data: events, isLoading: eventsLoading, error: eventsError } = useCollection<Event>(eventsQuery);

  const handleEventSelection = (eventId: string) => {
    if (eventId) {
      setEventId(eventId);
      router.push(`/login/${eventId}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-select">Select Event</Label>
        <Select onValueChange={handleEventSelection} value={selectedEventId || ''} disabled={eventsLoading}>
          <SelectTrigger id="event-select" className="w-full">
            <SelectValue placeholder={eventsLoading ? 'Loading events...' : 'Select an event...'} />
          </SelectTrigger>
          <SelectContent>
            {events && events.length > 0 && events.sort((a,b) => a.name.localeCompare(b.name)).map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {eventsLoading && (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )}

        {!eventsLoading && eventsError && (
             <div className='text-center text-sm text-destructive p-4 border border-destructive/50 rounded-md'>
                <p>Could not connect to the database.</p>
            </div>
        )}
      </div>

       <div className='text-center text-sm text-muted-foreground pt-2'>
        <p>After selecting an event, you will be prompted to choose your panel and enter a password.</p>
      </div>
    </div>
  );
}
