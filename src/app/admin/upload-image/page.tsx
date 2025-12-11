'use client';

import { CustomizeLoginForm } from "@/components/admin/CustomizeLoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentLoginBackground } from "@/components/admin/CurrentLoginBackground";


export default function CustomizeLoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Customize Backgrounds</h1>
      
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
                This image appears behind the Jury/Admin login forms.
            </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
                    <CustomizeLoginForm configId="loginBackground" />
                </Suspense>
            </CardContent>
        </Card>
      </div>

       <div className="space-y-6 pt-6">
          <h2 className="text-2xl font-bold tracking-tight">Current Backgrounds</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Pre-Landing Page</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<Skeleton className="aspect-video w-full" />}>
                            <CurrentLoginBackground configId="preLandingBackground" />
                        </Suspense>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Login Page</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<Skeleton className="aspect-video w-full" />}>
                            <CurrentLoginBackground configId="loginBackground" />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
       </div>
    </div>
  );
}
