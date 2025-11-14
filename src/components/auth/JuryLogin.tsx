
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import type { Jury } from '@/lib/types';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Input } from '../ui/input';
import { verifyJuryPassword } from '@/lib/actions';

export function JuryLogin() {
  const [selectedJury, setSelectedJury] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const juriesQuery = useMemoFirebase(() => collection(firestore, 'juries'), [firestore]);
  const { data: juries, isLoading: statusIsLoading, error } = useCollection<Jury>(juriesQuery);
  const status = error ? 'error' : statusIsLoading ? 'loading' : 'success';


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJury) {
      toast({
        title: 'Selection Required',
        description: 'Please select your panel to log in.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    const result = await verifyJuryPassword(selectedJury, password);

    if (result.success) {
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
    <form onSubmit={handleLogin} className="space-y-4">
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
  );
}
