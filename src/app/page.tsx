
import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JuryLogin } from '@/components/auth/JuryLogin';
import { AdminLogin } from '@/components/auth/AdminLogin';
import { AppLogo } from '@/components/layout/AppLogo';
import { LoginBackground } from '@/components/auth/LoginBackground';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

async function getLoginBackgroundUrl() {
  try {
    const docRef = doc(db, 'appConfig', 'loginBackground');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data()?.imageUrl;
    }
  } catch (error) {
    // This might happen on first deploy or if Firestore rules are restrictive before login.
    // We'll fall back to the placeholder image.
    console.log("Could not fetch login background from Firestore, using fallback.");
  }
  
  // Always have a fallback to the placeholder image.
  const fallback = PlaceHolderImages.find(img => img.id === 'login-background');
  return fallback?.imageUrl;
}

export default async function LoginPage() {
  const backgroundImageUrl = await getLoginBackgroundUrl();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {backgroundImageUrl ? (
        <Suspense fallback={<Skeleton className="absolute inset-0 -z-10" />}>
          <LoginBackground backgroundImageUrl={backgroundImageUrl} />
        </Suspense>
      ) : (
        <div className="absolute inset-0 -z-10 bg-muted" />
      )}
      
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
              <JuryLogin />
            </TabsContent>
            <TabsContent value="admin" className="mt-6">
              <AdminLogin />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
