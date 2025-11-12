
import { CustomizeLoginForm } from "@/components/admin/CustomizeLoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function CustomizeLoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Customize Login Page</h1>
      
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Update Login Background</CardTitle>
          <CardDescription>
            You can either upload a new image directly or provide a URL to an existing image.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
                 <CustomizeLoginForm />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
