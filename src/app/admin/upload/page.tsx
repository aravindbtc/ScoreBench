import { TeamUploadForm } from "@/components/admin/TeamUploadForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadTeamsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Upload Teams</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Team Data</CardTitle>
          <CardDescription>
            Upload a JSON file containing an array of teams. Each object should have a `teamName` and `projectName`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
