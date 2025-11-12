
'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { getLoginBackground } from "@/lib/actions";
import { Skeleton } from '../ui/skeleton';
import type { ImagePlaceholder } from '@/lib/types';

export function CurrentLoginBackground() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image
                src={imageUrl}
                alt="Current login background"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
            />
        </div>
    );
}
