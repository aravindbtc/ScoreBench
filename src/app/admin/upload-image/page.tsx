
import { CustomizeLoginForm } from "@/components/admin/CustomizeLoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginBackground } from "@/lib/actions";
import Image from "next/image";
import { CurrentLoginBackground } from "@/components/admin/CurrentLoginBackground";


export default async function CustomizeLoginPage() {
  const currentBackground = await getLoginBackground();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Customize Login Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Update Login Background</CardTitle>
                <CardDescription>
                    You can either upload a new image directly or provide a URL to an existing image. The new background will be reflected on the login page after saving.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
                        <CustomizeLoginForm currentImageUrl={currentBackground.imageUrl} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Current Background</CardTitle>
                    <CardDescription>This is the image currently displayed on the login page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<Skeleton className="aspect-video w-full" />}>
                        <CurrentLoginBackground imageUrl={currentBackground.imageUrl} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
