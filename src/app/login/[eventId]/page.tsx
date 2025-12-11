
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import type { Jury, Event } from '@/lib/types';
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { verifyJuryPassword } from '@/lib/actions';
import { useEvent } from '@/hooks/use-event';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AppLogo } from '@/components/layout/AppLogo';
import { Suspense } from 'react';
import { LoginBackground } from '@/components/auth/LoginBackground';
import { Skeleton } from '@/components/ui/skeleton';

export default function JuryPanelLoginPage() {
  const [selectedJury, setSelectedJury] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { setEventId } = useEvent();

  const eventDocRef = useMemoFirebase(() => {
    if (!eventId) return null;
    return doc(firestore, 'events', eventId);
  }, [firestore, eventId]);
  const { data: eventData } = useDoc<Event>(eventDocRef);

  const juriesQuery = useMemoFirebase(() => {
    if (!eventId) return null;
    return query(collection(firestore, `events/${eventId}/juries`));
  }, [firestore, eventId]);
  const { data: juries, isLoading: juriesLoading } = useCollection<Jury>(juriesQuery);
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !selectedJury) {
      toast({
        title: 'Selection Required',
        description: 'Please select your panel to log in.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    const result = await verifyJuryPassword(eventId, selectedJury, password);

    if (result.success) {
      try {
        const userCredential = await signInAnonymously(auth);
        if (userCredential.user) {
          localStorage.setItem('juryPanel', selectedJury);
          setEventId(eventId);
          router.push('/jury');
        }
      } catch (error) {
        console.error('Anonymous sign-in failed', error);
        toast({
          title: 'Login Failed',
          description: 'Could not log you in. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } else {
       toast({
        title: 'Login Failed',
        description: result.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
        <Suspense fallback={<Skeleton className="absolute inset-0 -z-10" />}>
            <LoginBackground isEventSpecific={true} />
        </Suspense>
        
        <div className="absolute top-6 left-6">
            <AppLogo />
        </div>
        <Card className="w-full max-w-md shadow-2xl bg-background/10 backdrop-blur-sm">
            <CardHeader className="text-center">
                 <h2 className="text-2xl font-bold tracking-tight text-primary">Jury Panel Login</h2>
                <p className="text-muted-foreground text-foreground/80">{eventData?.name || 'Select your panel and enter the password to continue.'}</p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="jury-select">Select Panel</Label>
                        <Select onValueChange={setSelectedJury} value={selectedJury} disabled={juriesLoading}>
                            <SelectTrigger id="jury-select" className="w-full">
                            <SelectValue placeholder={juriesLoading ? "Loading panels..." : "Select your panel..."} />
                            </SelectTrigger>
                            <SelectContent>
                            {juries && juries.sort((a,b) => a.panelNo - b.panelNo).map((jury) => (
                                <SelectItem key={jury.id} value={jury.panelNo.toString()}>
                                {jury.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Panel Password</Label>
                        <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pr-10"
                            disabled={!selectedJury}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={!selectedJury}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading || !selectedJury || !password} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login as Jury
                    </Button>
                </form>
            </CardContent>
        </Card>
    </main>
  );
}
