'use client';

import Image from 'next/image';
import type { ImagePlaceholder } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface LoginBackgroundProps {
  background: ImagePlaceholder | null;
}

export function LoginBackground({ background }: LoginBackgroundProps) {
  if (!background || !background.imageUrl) {
    // Render a skeleton or nothing if the URL isn't available on initial render
    return <Skeleton className="absolute inset-0 -z-10" />;
  }

  return (
    <Image
      src={background.imageUrl}
      alt={background.description || "Login background"}
      fill
      className="object-cover -z-10 opacity-30"
      data-ai-hint={background.imageHint}
      priority
    />
  );
}
