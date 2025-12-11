
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyAdminPassword } from '@/lib/actions';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useEvent } from '@/hooks/use-event';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { setEventId } = useEvent();
  const auth = useAuth();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await verifyAdminPassword(password);
    if (result.success) {
      try {
        await signInAnonymously(auth);
        sessionStorage.setItem('admin-auth', 'true');
        // Clear any previously selected event ID when admin logs in
        setEventId(null);
        router.push('/admin/events');
      } catch (error) {
         toast({
          title: 'Firebase Login Failed',
          description: 'Could not authenticate with Firebase. Please try again.',
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
        <Label htmlFor="password">Admin Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Login as Admin
      </Button>
    </form>
  );
}
