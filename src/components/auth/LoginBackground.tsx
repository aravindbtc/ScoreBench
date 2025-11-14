
'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface LoginBackgroundProps {
  backgroundImageUrl: string;
}

export function LoginBackground({ backgroundImageUrl }: LoginBackgroundProps) {
  if (!backgroundImageUrl) {
    // Render a skeleton or nothing if the URL isn't available
    return <Skeleton className="absolute inset-0 -z-10" />;
  }

  return (
    <Image
      src={backgroundImageUrl}
      alt={"Login background"}
      fill
      className="object-cover -z-10"
      priority
    />
  );
}
