
import { CustomizeLoginForm } from "@/components/admin/CustomizeLoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginBackground } from "@/lib/actions";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default async function CustomizeLoginPage() {
    const currentBackground = await getLoginBackground();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Customize Login Page</h1>
      
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Update Login Background</CardTitle>
          <CardDescription>
            Upload a new image to Firebase Storage or provide an image URL. After setting the URL, click 'Save Background' to update the login screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                 <CustomizeLoginForm currentBackground={currentBackground} />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
