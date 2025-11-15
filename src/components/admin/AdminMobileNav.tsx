
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, Trophy } from 'lucide-react';
import { AppLogo } from '../layout/AppLogo';

export function AdminMobileNav({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="p-4 border-b">
           <AppLogo />
        </div>
        <nav className="flex flex-col space-y-2 p-4" onClick={() => setIsOpen(false)}>
            {children}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
