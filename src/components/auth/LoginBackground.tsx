
'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useMemo } from 'react';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

interface LoginBackgroundProps {
  fallbackImageUrl?: string;
}

export function LoginBackground({ fallbackImageUrl }: LoginBackgroundProps) {
  const firestore = useFirestore();
  const [imageUrl, setImageUrl] = useState(fallbackImageUrl);

  // Hook to fetch the customized URL from Firestore
  const loginBgConfigRef = useMemo(() => doc(firestore, 'appConfig', 'loginBackground'), [firestore]);
  const { data: customBgData } = useDoc<{imageUrl: string}>(loginBgConfigRef);

  // Effect to update the image URL when custom data is loaded
  useEffect(() => {
    if (customBgData?.imageUrl) {
      setImageUrl(customBgData.imageUrl);
    } else {
      setImageUrl(fallbackImageUrl);
    }
  }, [customBgData, fallbackImageUrl]);

  if (!imageUrl) {
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
