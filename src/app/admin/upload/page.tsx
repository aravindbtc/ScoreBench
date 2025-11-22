
import { TeamUploadForm } from "@/components/admin/TeamUploadForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadTeamsPage() {
  const exampleJson = `
[
  {
    "teamName": "The Code Crusaders",
    "projectName": "Eco-Friendly Drone Delivery"
  },
  {
    "teamName": "Data Dynamos",
    "projectName": "AI-Powered Healthcare Chatbot"
  }
]
  `.trim();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Upload Teams</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
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
        <Card>
           <CardHeader>
            <CardTitle>Example JSON Format</CardTitle>
            <CardDescription>
              Your JSON file should contain an array of objects. The app can also intelligently parse keys like 'team_name' or 'project_title'.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-md text-sm text-muted-foreground overflow-auto">
              <code>{exampleJson}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
