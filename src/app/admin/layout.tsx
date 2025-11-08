import { AdminAuth } from '@/components/auth/AdminAuth';
import { AppHeader } from '@/components/layout/AppHeader';
import { NavLink } from '@/components/layout/NavLink';
import { BarChart, Upload } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuth>
      <div className="min-h-screen">
        <AppHeader userRole="Admin" />
        <div className="flex">
          <aside className="w-64 flex-shrink-0 border-r p-4 hidden md:block">
            <nav className="flex flex-col space-y-2">
              <h3 className="px-4 text-lg font-semibold tracking-tight">Admin Menu</h3>
              <NavLink href="/admin">
                <BarChart className="mr-2 h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink href="/admin/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Teams
              </NavLink>
            </nav>
          </aside>
          <main className="flex-1 p-4 sm:p-8">{children}</main>
        </div>
      </div>
    </AdminAuth>
  );
}
