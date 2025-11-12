
'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ImagePlaceholder } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function CurrentLoginBackground() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const configDocRef = doc(db, 'appConfig', 'loginBackground');
        
        const unsubscribe = onSnapshot(configDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as ImagePlaceholder;
                setImageUrl(data.imageUrl);
            } else {
                // If doc doesn't exist, use the local fallback
                const fallback = PlaceHolderImages.find(img => img.id === 'login-background');
                setImageUrl(fallback?.imageUrl || null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch current background in real-time", error);
            // This is the key part for the "offline" error.
            if (error.code === 'unavailable' || error.message.includes('offline')) {
                 toast({
                    title: 'Firestore Connection Error',
                    description: 'Could not connect to the database. It might not be created yet. Using local fallback image.',
                    variant: 'destructive',
                });
                const fallback = PlaceHolderImages.find(img => img.id === 'login-background');
                setImageUrl(fallback?.imageUrl || null);
            } else {
                toast({
                    title: 'Error',
                    description: 'Could not load current background. Check console for details.',
                    variant: 'destructive'
                });
            }
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [toast]);

    const handleCopy = () => {
        if (imageUrl) {
            navigator.clipboard.writeText(imageUrl);
            toast({
                title: 'Copied to Clipboard!',
                description: 'The image URL has been copied.',
            });
        }
    };

    if (loading) {
        return <Skeleton className="aspect-video w-full" />;
    }

    if (!imageUrl) {
        return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border flex items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">Could not load image.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                    src={imageUrl}
                    alt="Current login background"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    priority
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="current-image-url">Image URL</Label>
                <div className="flex items-center gap-2">
                    <Input id="current-image-url" readOnly value={imageUrl} className="text-xs" />
                    <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy URL">
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
