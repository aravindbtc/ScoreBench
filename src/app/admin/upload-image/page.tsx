import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function UploadImagePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Upload Custom Image</h1>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How to update the login background</AlertTitle>
        <AlertDescription>
         This form allows you to upload an image to Firebase Storage. After a successful upload, it will provide you with a code snippet. To change the login screen background, you must copy this snippet and replace the existing content in the <code className="font-semibold text-foreground">src/lib/placeholder-images.json</code> file.
        </AlertDescription>
      </Alert>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Upload Image to Firebase Storage</CardTitle>
          <CardDescription>
            Select an image file from your computer to begin the upload process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
