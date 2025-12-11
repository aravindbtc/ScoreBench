
'use client';

import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FirebaseClientProvider } from '@/firebase';
import { EventProvider } from '@/hooks/use-event';
import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FirebaseClientProvider>
        <EventProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </EventProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
