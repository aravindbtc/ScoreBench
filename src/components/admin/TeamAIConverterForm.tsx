
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, Wand2, Copy, Upload } from 'lucide-react';
import { convertTextToTeamsJson } from '@/ai/flows/convert-text-to-teams-json';
import { Input } from '../ui/input';

const converterSchema = z.object({
  rawText: z.string().min(1, 'Please paste some text or upload a file to convert.'),
});

export function TeamAIConverterForm() {
  const [isConverting, setIsConverting] = useState(false);
  const [convertedJson, setConvertedJson] = useState('');
  const { toast } = useToast();

  const form = useForm<{ rawText: string }>({
    resolver: zodResolver(converterSchema),
    defaultValues: {
      rawText: '',
    },
  });
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        form.setValue('rawText', text, { shouldValidate: true });
        toast({
            title: 'File Loaded',
            description: `Content from "${file.name}" is ready to be converted.`,
        });
    };
    reader.onerror = () => {
        toast({
            title: 'File Read Error',
            description: 'Could not read the selected file.',
            variant: 'destructive',
        });
    };
    reader.readAsText(file);
  };


  const onSubmit = async (data: { rawText: string }) => {
    setIsConverting(true);
    setConvertedJson('');
    try {
      const result = await convertTextToTeamsJson(data.rawText);
      const prettyJson = JSON.stringify(JSON.parse(result.json), null, 2);
      setConvertedJson(prettyJson);
      toast({
        title: 'Conversion Successful!',
        description: 'The AI has converted your text into JSON format below.',
      });
    } catch (error) {
      console.error('Error converting text to JSON:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: 'Conversion Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  const handleCopy = () => {
    if (convertedJson) {
        navigator.clipboard.writeText(convertedJson);
        toast({
            title: 'Copied to Clipboard!',
            description: 'You can now paste this in the "Paste JSON" tab.',
        });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rawText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paste text or upload a file</FormLabel>
               <FormDescription>
                Paste a list, CSV data, or unstructured notes. The AI will do its best to convert it.
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder='Example: Team Alpha, Project Phoenix...'
                  className="min-h-[150px] font-mono text-xs"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
             <Button type="submit" disabled={isConverting}>
                {isConverting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Converting...
                    </>
                ) : (
                    <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Convert with AI
                    </>
                )}
            </Button>
            <div className="relative flex items-center">
                <div className="flex-grow border-t"></div>
                <span className="flex-shrink mx-2 text-xs text-muted-foreground">OR</span>
                <div className="flex-grow border-t"></div>
            </div>
            <div className="flex items-center">
                <Input id="file-upload" type="file" onChange={handleFileChange} className="sr-only" />
                <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload File
                    </label>
                </Button>
            </div>
        </div>

        {convertedJson && (
            <div className="space-y-2 pt-4">
                 <FormLabel>Converted JSON Output</FormLabel>
                 <FormDescription>
                    Copy this output and use it in the "Paste JSON" tab to upload the teams.
                </FormDescription>
                <div className="relative">
                    <Textarea
                        readOnly
                        value={convertedJson}
                        className="min-h-[150px] font-mono text-xs bg-muted/50"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7"
                        onClick={handleCopy}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}
      </form>
    </Form>
  );
}
