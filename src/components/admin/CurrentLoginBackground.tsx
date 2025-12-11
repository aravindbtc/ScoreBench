'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { Skeleton } from '../ui/skeleton';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';

interface CurrentLoginBackgroundProps {
    configId: 'loginBackground' | 'preLandingBackground';
}

export function CurrentLoginBackground({ configId }: CurrentLoginBackgroundProps) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const loginBgConfigRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'appConfig', configId);
    }, [firestore, configId]);

    const { data, isLoading, error } = useDoc<{imageUrl: string}>(loginBgConfigRef);

    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (data?.imageUrl) {
            setImageUrl(data.imageUrl);
        } else if (!isLoading) {
            // Use a default placeholder if no image is set
            setImageUrl('https://images.unsplash.com/photo-1554189097-9e73e9363344?q=80&w=2070&auto=format&fit=crop');
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

    if (isLoading || !imageUrl) {
        return <Skeleton className="aspect-video w-full" />;
    }

    if (error) {
         return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border flex items-center justify-center bg-destructive/10 text-destructive">
                <p className="text-sm text-center p-4">Could not load current background. You may not have permission to view it.</p>
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
