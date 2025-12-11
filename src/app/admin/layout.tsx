'use client';

import { AdminAuth } from '@/components/auth/AdminAuth';
import { AppHeader } from '@/components/layout/AppHeader';
import { NavLink } from '@/components/layout/NavLink';
import { BarChart, Image, Upload, ListChecks, Settings, Home } from 'lucide-react';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { useEvent } from '@/hooks/use-event';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { eventId, isEventLoading } = useEvent();
  const pathname = usePathname();

  // The Events page is always visible.
  // The other management links are only visible if an event is selected
  // and we are NOT on the events page itself.
  const showManagementLinks = !!eventId && pathname !== '/admin/events';

  const navItems = (
    <>
        <NavLink href="/admin/events">
            <Home className="mr-2 h-4 w-4" />
            Events
        </NavLink>
        {showManagementLinks && (
          <>
            <NavLink href="/admin">
                <BarChart className="mr-2 h-4 w-4" />
                Dashboard
            </NavLink>
            <NavLink href="/admin/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Teams
            </NavLink>
            <NavLink href="/admin/criteria">
                <ListChecks className="mr-2 h-4 w-4" />
                Manage Criteria
            </NavLink>
            <NavLink href="/admin/upload-image">
                <Image className="mr-2 h-4 w-4" />
                Customize Backgrounds
            </NavLink>
            <NavLink href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                App Settings
            </NavLink>
          </>
        )}
    </>
  );


  return (
    <AdminAuth>
      <div className="min-h-screen">
        <AppHeader userRole="Admin">
           <div className="md:hidden">
              <AdminMobileNav>
                {navItems}
              </AdminMobileNav>
            </div>
        </AppHeader>
        <div className="flex">
          {showManagementLinks && (
             <aside className="w-64 flex-shrink-0 border-r p-4 hidden md:block">
              <nav className="flex flex-col space-y-2">
                <h3 className="px-4 text-lg font-semibold tracking-tight">Admin Menu</h3>
                {navItems}
              </nav>
            </aside>
          )}
          <main className="flex-1 p-4 sm:p-8">{children}</main>
        </div>
      </div>
    </AdminAuth>
  );
}
