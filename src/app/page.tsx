'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginBackground } from '@/components/auth/LoginBackground';
import { AppLogo } from '@/components/layout/AppLogo';
import { ArrowRight } from 'lucide-react';

export default function PreLandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <Suspense fallback={<Skeleton className="absolute inset-0 -z-10" />}>
        <LoginBackground configId="preLandingBackground" />
      </Suspense>
      
      <div className="z-10 flex flex-col items-center space-y-6">
        <div className="absolute top-6 left-6">
            <AppLogo />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
            Welcome to ScoreBench
        </h1>
        <p className="text-lg md:text-xl text-white/90 drop-shadow-md max-w-2xl">
            The modern, real-time evaluation platform for hackathons, ideathons, and competitions.
        </p>
        <Button asChild size="lg">
          <Link href="/login">
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
