
'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Event } from '@/lib/types';
import { useEvent } from '@/hooks/use-event';

interface LoginBackgroundProps {
  configId?: 'loginBackground' | 'preLandingBackground';
  isEventSpecific?: boolean;
}

export function LoginBackground({ configId, isEventSpecific = false }: LoginBackgroundProps) {
  const firestore = useFirestore();
  const { eventId, isEventLoading } = useEvent();
  
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const docRef = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isEventSpecific) {
        return eventId ? doc(firestore, 'events', eventId) : null;
    }
    return configId ? doc(firestore, 'appConfig', configId) : null;
  }, [firestore, configId, isEventSpecific, eventId]);

  const { data, isLoading } = useDoc<Event | { imageUrl: string }>(docRef);

  useEffect(() => {
    let url;
    if (isEventSpecific) {
        url = (data as Event)?.backgroundImageUrl;
    } else {
        url = (data as { imageUrl: string })?.imageUrl;
    }

    if (url) {
        setImageUrl(url);
    } else if (!isLoading && !isEventLoading) {
        // Fallback only after confirming no specific URL is set and we are not loading
        setImageUrl('https://images.unsplash.com/photo-1554189097-9e73e9363344?q=80&w=2070&auto=format&fit=crop');
    }
  }, [data, isLoading, isEventLoading, isEventSpecific]);
  
  const shouldShowSkeleton = isLoading || isEventLoading || !imageUrl;

  if (shouldShowSkeleton) {
    return <Skeleton className="absolute inset-0 -z-10" />;
  }

  return (
    <Image
      key={imageUrl}
      src={imageUrl}
      alt={"Login background"}
      fill
      className="object-cover -z-10"
      priority
    />
  );
}
