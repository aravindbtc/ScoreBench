
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { db } from '@/lib/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function CurrentLoginBackground() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const loginBgConfigRef = useMemo(() => doc(firestore, 'appConfig', 'loginBackground'), [firestore]);
    const { data, isLoading, error } = useDoc<{imageUrl: string}>(loginBgConfigRef);

    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const fallback = PlaceHolderImages.find(img => img.id === 'login-background');
        if (data?.imageUrl) {
            setImageUrl(data.imageUrl);
        } else if (!isLoading) {
            // If there's no data from Firestore, use the local fallback
            setImageUrl(fallback?.imageUrl || null);
        }
    }, [data, isLoading]);

    const handleCopy = () => {
        if (imageUrl) {
            navigator.clipboard.writeText(imageUrl);
            toast({
                title: 'Copied to Clipboard!',
                description: 'The image URL has been copied.',
            });
        }
    };

    if (isLoading) {
        return <Skeleton className="aspect-video w-full" />;
    }

    if (error) {
         return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border flex items-center justify-center bg-destructive/10 text-destructive">
                <p className="text-sm text-center p-4">Could not load current background. You may not have permission to view it.</p>
            </div>
        );
    }
    
    if (!imageUrl) {
        return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border flex items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">No background image is set.</p>
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
