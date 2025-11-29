
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, Wand2, Copy } from 'lucide-react';
import { convertTextToTeamsJson } from '@/ai/flows/convert-text-to-teams-json';

const converterSchema = z.object({
  rawText: z.string().min(1, 'Please paste some text to convert.'),
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
              <FormLabel>Paste any text format</FormLabel>
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
