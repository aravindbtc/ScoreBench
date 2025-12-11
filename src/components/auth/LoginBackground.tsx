
'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface LoginBackgroundProps {
  configId: 'loginBackground' | 'preLandingBackground';
  imageUrl?: string | null;
}

export function LoginBackground({ configId, imageUrl: imageUrlProp }: LoginBackgroundProps) {
  const firestore = useFirestore();
  const [imageUrl, setImageUrl] = useState<string | undefined>(imageUrlProp || undefined);

  // Hook to fetch the customized URL from Firestore for global backgrounds
  const globalBgConfigRef = useMemoFirebase(() => {
    // Only fetch global config if no specific imageUrl is passed
    if (!firestore || imageUrlProp) return null;
    return doc(firestore, 'appConfig', configId);
  }, [firestore, configId, imageUrlProp]);

  const { data: customBgData, isLoading } = useDoc<{imageUrl: string}>(globalBgConfigRef);

  // Effect to update the image URL when custom data is loaded or prop changes
  useEffect(() => {
    if (imageUrlProp) {
        setImageUrl(imageUrlProp);
    } else if (customBgData?.imageUrl) {
      setImageUrl(customBgData.imageUrl);
    } else {
        // Fallback to a default if no custom URL is set, only after loading is complete
        if (!isLoading && !imageUrlProp) {
            setImageUrl('https://images.unsplash.com/photo-1554189097-9e73e9363344?q=80&w=2070&auto=format&fit=crop');
        }
    }
  }, [customBgData, isLoading, imageUrlProp]);

  if (isLoading || !imageUrl) {
    return <Skeleton className="absolute inset-0 -z-10" />;
  }

  return (
    <Image
      key={imageUrl} // Add key to force re-render on URL change
      src={imageUrl}
      alt={"Login background"}
      fill
      className="object-cover -z-10"
      priority
    />
  );
}
