import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>
      <Suspense fallback={<Skeleton className='h-96 w-full' />}>
        <AdminDashboard />
      </Suspense>
    </div>
  );
}
