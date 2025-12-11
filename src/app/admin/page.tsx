
'use client';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Suspense, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEvent } from '@/hooks/use-event';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { eventId, isEventLoading } = useEvent();

  useEffect(() => {
    if (!isEventLoading && !eventId) {
      router.push('/admin/events');
    }
  }, [eventId, isEventLoading, router]);

  if (isEventLoading || !eventId) {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>
            <Skeleton className='h-96 w-full' />
        </div>
    )
  }

  if (!eventId) {
    return (
         <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center p-8">
                <CardHeader>
                    <CardTitle className="text-2xl">No Event Selected</CardTitle>
                    <CardDescription>To manage teams, juries, and scores, you must first select an event.</CardDescription>
                </CardHeader>
                <Button asChild>
                    <Link href="/admin/events">
                        Go to Events Page <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </Card>
        </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>
      <Suspense fallback={<Skeleton className='h-96 w-full' />}>
        <AdminDashboard />
      </Suspense>
    </div>
  );
}
