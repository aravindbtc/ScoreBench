'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { useAuthListener } from '@/hooks/use-auth-listener';
import { Loader2 } from 'lucide-react';

export default function JuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuthListener();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader userRole="Jury" />
      <main className="container py-8">{children}</main>
    </div>
  );
}
