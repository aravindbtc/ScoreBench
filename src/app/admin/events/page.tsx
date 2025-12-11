'use client';
import { EventManagement } from '@/components/admin/EventManagement';
import { CustomizeLoginForm } from '@/components/admin/CustomizeLoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsPage() {
    return (
        <div className="space-y-8">
            <EventManagement />

            <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">Global Background Images</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                        <CardTitle>Pre-Landing Page Background</CardTitle>
                        <CardDescription>
                            This is the first image users see on the welcome page.
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
                                <CustomizeLoginForm configId="preLandingBackground" />
                            </Suspense>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                        <CardTitle>Login Page Background</CardTitle>
                        <CardDescription>
                            This image appears behind the Jury/Admin role selection.
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
                                <CustomizeLoginForm configId="loginBackground" />
                            </Suspense>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
