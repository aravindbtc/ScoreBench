import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadImagePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Upload Image</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Upload an Image to Firebase Storage</CardTitle>
          <CardDescription>
            Select an image file from your computer to upload. After the upload is complete, the public URL will be displayed for you to copy and use in the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
