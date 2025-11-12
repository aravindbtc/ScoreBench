
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
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
import { Loader2 } from 'lucide-react';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import type { Jury } from '@/lib/types';

export function JuryLogin() {
  const [selectedJury, setSelectedJury] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const juriesQuery = useMemo(() => collection(db, 'juries'), []);
  const { data: juries, status } = useFirestoreQuery<Jury>(juriesQuery);

  const handleLogin = async () => {
    if (!selectedJury) {
      toast({
        title: 'Selection Required',
        description: 'Please select your panel to log in.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      if (userCredential.user) {
        localStorage.setItem('juryPanel', selectedJury);
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
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="jury-select">Select Panel</Label>
        {status === 'loading' && <p>Loading panels...</p>}
        {status === 'success' && juries && juries.length > 0 && (
           <Select onValueChange={setSelectedJury} value={selectedJury}>
            <SelectTrigger id="jury-select" className="w-full">
              <SelectValue placeholder="Select your panel..." />
            </SelectTrigger>
            <SelectContent>
              {juries.sort((a,b) => a.panelNo - b.panelNo).map((jury) => (
                <SelectItem key={jury.id} value={jury.panelNo.toString()}>
                  {jury.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
         {(status === 'success' && juries && juries.length === 0) && (
          <div className='text-center text-sm text-muted-foreground p-4 border rounded-md'>
            <p>No jury panels found.</p>
            <p>An admin needs to add them via the admin dashboard.</p>
          </div>
        )}
         {status === 'error' && (
           <div className='text-center text-sm text-destructive p-4 border border-destructive/50 rounded-md'>
            <p>Could not connect to the database.</p>
            <p>Please ensure Firestore is enabled and permissions are set.</p>
          </div>
        )}
      </div>
      <Button onClick={handleLogin} disabled={isLoading || !selectedJury} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Login as Jury
      </Button>
    </div>
  );
}
