
import { TeamUploadForm } from "@/components/admin/TeamUploadForm";
import { TeamJsonPasteForm } from "@/components/admin/TeamJsonPasteForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamAIConverterForm } from "@/components/admin/TeamAIConverterForm";

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
              Choose your preferred method: convert from text with AI, paste JSON, or upload a file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ai-converter" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ai-converter">Convert with AI</TabsTrigger>
                <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="ai-converter" className="mt-6">
                <TeamAIConverterForm />
              </TabsContent>
              <TabsContent value="paste" className="mt-6">
                <TeamJsonPasteForm />
              </TabsContent>
              <TabsContent value="upload" className="mt-6">
                <TeamUploadForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
           <CardHeader>
            <CardTitle>Example JSON Format</CardTitle>
            <CardDescription>
              Your final JSON should contain an array of objects. The "Convert with AI" tool will generate this for you.
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
