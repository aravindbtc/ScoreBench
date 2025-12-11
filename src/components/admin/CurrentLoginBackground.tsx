'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { Skeleton } from '../ui/skeleton';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useEvent } from '@/hooks/use-event';
import type { Event } from '@/lib/types';

interface CurrentLoginBackgroundProps {
    configId: 'loginBackground' | 'preLandingBackground' | 'juryLoginBackground';
    isEventSpecific?: boolean;
}

export function CurrentLoginBackground({ configId, isEventSpecific = false }: CurrentLoginBackgroundProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { eventId } = useEvent();

    const docRef = useMemoFirebase(() => {
        if (!firestore) return null;
        if (isEventSpecific) {
            return eventId ? doc(firestore, 'events', eventId) : null;
        }
        return doc(firestore, 'appConfig', configId);
    }, [firestore, configId, isEventSpecific, eventId]);

    const { data, isLoading, error } = useDoc<Event | { imageUrl: string }>(docRef);

    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !docRef) {
            setImageUrl('https://images.unsplash.com/photo-1554189097-9e73e9363344?q=80&w=2070&auto=format&fit=crop');
            return;
        }

        if (data) {
            let url;
            if (isEventSpecific) {
                url = (data as Event).backgroundImageUrl;
            } else {
                url = (data as { imageUrl: string }).imageUrl;
            }

            if (url) {
                setImageUrl(url);
            } else {
                 setImageUrl('https://images.unsplash.com/photo-1554189097-9e73e9363344?q=80&w=2070&auto=format&fit=crop');
            }
        } else if (!isLoading) {
            setImageUrl('https://images.unsplash.com/photo-1554189097-9e73e9363344?q=80&w=2070&auto=format&fit=crop');
        }
    }, [data, isLoading, docRef, isEventSpecific]);

    const handleCopy = () => {
        if (imageUrl) {
            navigator.clipboard.writeText(imageUrl);
            toast({
                title: 'Copied to Clipboard!',
                description: 'The image URL has been copied.',
            });
        }
    };

    if (isLoading || !imageUrl) {
        return <Skeleton className="aspect-video w-full" />;
    }

    if (error) {
         return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border flex items-center justify-center bg-destructive/10 text-destructive">
                <p className="text-sm text-center p-4">Could not load current background.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                    src={imageUrl}
                    alt="Current background"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`current-image-url-${configId}`}>Image URL</Label>
                <div className="flex items-start gap-2">
                    <Textarea 
                      id={`current-image-url-${configId}`}
                      readOnly 
                      value={imageUrl} 
                      className="text-xs h-24" 
                      rows={3}
                    />
                    <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy URL">
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
