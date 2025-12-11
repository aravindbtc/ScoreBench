
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';

export function useAuthListener(redirectTo = '/') {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
        // Only redirect if the current path is protected
        if (window.location.pathname !== redirectTo) {
          router.push(redirectTo);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router, redirectTo]);

  return { user, isLoading };
}
