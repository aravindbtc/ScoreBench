
'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JuryLogin } from '@/components/auth/JuryLogin';
import { AdminLogin } from '@/components/auth/AdminLogin';
import { AppLogo } from '@/components/layout/AppLogo';
import { LoginBackground } from '@/components/auth/LoginBackground';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Simplified function to always get the fallback image URL.
// The actual custom URL will be fetched on the client.
function getLoginBackgroundUrl() {
  const fallback = PlaceHolderImages.find(img => img.id === 'login-background');
  return fallback?.imageUrl;
}

export default function LoginPage() {
  const backgroundImageUrl = getLoginBackgroundUrl();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <Suspense fallback={<Skeleton className="absolute inset-0 -z-10" />}>
        <LoginBackground fallbackImageUrl={backgroundImageUrl} />
      </Suspense>
      
      <div className="absolute top-6 left-6">
        <AppLogo />
      </div>

      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Welcome to ScoreBench</h2>
          <p className="text-muted-foreground">Select your role to proceed</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="jury" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jury">Jury</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            <TabsContent value="jury" className="mt-6">
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <JuryLogin />
              </Suspense>
            </TabsContent>
            <TabsContent value="admin" className="mt-6">
               <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <AdminLogin />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
