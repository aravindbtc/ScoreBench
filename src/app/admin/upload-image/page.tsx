'use client';

import { CustomizeLoginForm } from "@/components/admin/CustomizeLoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentLoginBackground } from "@/components/admin/CurrentLoginBackground";
import { useEvent } from "@/hooks/use-event";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";


export default function CustomizeJuryLoginPage() {
  const router = useRouter();
  const { eventId, isEventLoading } = useEvent();

  useEffect(() => {
    if (!isEventLoading && !eventId) {
      router.push('/admin/events');
    }
  }, [eventId, isEventLoading, router]);

  if (isEventLoading || !eventId) {
    return (
      <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center p-8">
                <CardHeader>
                    <CardTitle className="text-2xl">No Event Selected</CardTitle>
                    <CardDescription>To customize a background, you must first select an event.</CardDescription>
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Customize Jury Login Background</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
            <CardTitle>Jury Panel Login Background</CardTitle>
            <CardDescription>
                This background will appear on the final login step for juries of the selected event.
            </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
                    <CustomizeLoginForm configId="juryLoginBackground" isEventSpecific={true} />
                </Suspense>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Current Background</CardTitle>
                 <CardDescription>
                    This is the background currently active for this event's jury login.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<Skeleton className="aspect-video w-full" />}>
                    <CurrentLoginBackground configId="juryLoginBackground" isEventSpecific={true} />
                </Suspense>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
