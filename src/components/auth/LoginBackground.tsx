
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { ImagePlaceholder } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function LoginBackground() {
  const [background, setBackground] = useState<ImagePlaceholder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configDocRef = doc(db, 'appConfig', 'loginBackground');
    
    const unsubscribe = onSnapshot(configDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setBackground(docSnap.data() as ImagePlaceholder);
        } else {
            // Fallback to the default from JSON file if Firestore doc doesn't exist
            const fallback = PlaceHolderImages.find((img) => img.id === 'login-background');
            if(fallback) setBackground(fallback);
        }
        setLoading(false);
    }, (error) => {
        console.error("Failed to listen to login background changes:", error);
        // On error, also use fallback
        const fallback = PlaceHolderImages.find((img) => img.id === 'login-background');
        if(fallback) setBackground(fallback);
        setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  if (loading) {
    return <Skeleton className="absolute inset-0 -z-10" />;
  }

  if (!background || !background.imageUrl) {
    return null;
  }

  return (
    <Image
      src={background.imageUrl}
      alt={background.description || "Login background"}
      fill
      className="object-cover -z-10 opacity-20"
      data-ai-hint={background.imageHint}
      priority
    />
  );
}
