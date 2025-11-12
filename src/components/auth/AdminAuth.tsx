
'use client';

import { useAuthListener } from '@/hooks/use-auth-listener';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AdminAuth({ children }: { children: React.ReactNode }) {
  // Use the Firebase auth listener hook to get real-time auth status
  const { user, isLoading } = useAuthListener('/?tab=admin');
  const router = useRouter();

  // Also check the sessionStorage flag for admin role verification
  const isAdminSession = typeof window !== 'undefined' && sessionStorage.getItem('admin-auth') === 'true';

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is finished but there's no Firebase user or no admin session flag,
  // redirect them to the login page.
  if (!user || !isAdminSession) {
    // router.push() is called in a useEffect within the hook,
    // so we can just return a loader here to prevent flashing content.
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated and is an admin, show the content.
  return <>{children}</>;
}
