
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getLoginBackground } from '@/lib/actions';
import type { ImagePlaceholder } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function LoginBackground() {
  const [background, setBackground] = useState<ImagePlaceholder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBackground() {
      try {
        const bg = await getLoginBackground();
        setBackground(bg);
      } catch (error) {
        console.error("Failed to fetch login background", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBackground();
  }, []);

  if (loading) {
    return <Skeleton className="absolute inset-0 -z-10" />;
  }

  if (!background) {
    return null;
  }

  return (
    <Image
      src={background.imageUrl}
      alt={background.description}
      fill
      className="object-cover -z-10 opacity-20"
      data-ai-hint={background.imageHint}
      priority
    />
  );
}
