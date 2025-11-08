'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { AppLogo } from './AppLogo';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AppHeader({ userRole }: { userRole: 'Jury' | 'Admin' }) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      if (userRole === 'Admin') {
        sessionStorage.removeItem('admin-auth');
      } else {
        await signOut(auth);
        localStorage.removeItem('juryPanel');
      }
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive'});
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <AppLogo />
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
