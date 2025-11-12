'use client';

import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FirebaseClientProvider } from '@/firebase';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </FirebaseClientProvider>
  );
}
