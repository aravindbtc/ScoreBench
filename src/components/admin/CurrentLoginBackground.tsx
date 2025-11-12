
'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { getLoginBackground } from "@/lib/actions";
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CurrentLoginBackground() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
      async function fetchBg() {
        try {
          const bg = await getLoginBackground();
          setImageUrl(bg.imageUrl);
        } catch (e) {
          console.error("Failed to fetch current background", e);
        } finally {
          setLoading(false);
        }
      }
      fetchBg();
    }, []);

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
