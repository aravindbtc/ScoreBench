
'use client';

import { useAuthListener } from '@/hooks/use-auth-listener';
import { Loader2 } from 'lucide-react';

export function AdminAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthListener('/admin/events');

  const isAdminSession = typeof window !== 'undefined' && sessionStorage.getItem('admin-auth') === 'true';

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdminSession) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
