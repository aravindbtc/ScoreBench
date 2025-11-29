
'use server';

/**
 * @fileOverview An AI flow to convert unstructured text into a structured JSON array of teams.
 *
 * - convertTextToTeamsJson - Converts a string of text into a JSON array of team objects.
 * - ConvertTextToTeamsJsonInput - Input type, a single string of text.
 * - ConvertTextToTeamsJsonOutput - Output type, a string containing a valid JSON array.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConvertTextToTeamsJsonInputSchema = z.string();
export type ConvertTextToTeamsJsonInput = z.infer<typeof ConvertTextToTeamsJsonInputSchema>;

const ConvertTextToTeamsJsonOutputSchema = z.object({
  json: z
    .string()
    .describe(
      'A valid JSON array of objects, where each object has a "teamName" and a "projectName". If no teams can be identified, return an empty array: [].'
    ),
});
export type ConvertTextToTeamsJsonOutput = z.infer<
  typeof ConvertTextToTeamsJsonOutputSchema
>;

export async function convertTextToTeamsJson(
  input: ConvertTextToTeamsJsonInput
): Promise<ConvertTextToTeamsJsonOutput> {
  return convertTextToTeamsJsonFlow(input);
}

const convertTextToTeamsJsonPrompt = ai.definePrompt({
  name: 'convertTextToTeamsJsonPrompt',
  input: { schema: ConvertTextToTeamsJsonInputSchema },
  output: { schema: ConvertTextToTeamsJsonOutputSchema },
  prompt: `You are an expert data parsing assistant. Your task is to analyze the following text and convert it into a valid JSON array of objects.

Each object in the array must have two keys: "teamName" and "projectName".

- Analyze the text to identify distinct teams and their corresponding project names.
- The text could be in any format: a list, comma-separated, informal notes, etc.
- If a project name is not explicitly mentioned for a team, set the "projectName" value to an empty string "".
- If you cannot identify any teams in the text, you MUST return an empty JSON array: [].
- Your final output must only be the JSON string. Do not include any other text or explanations.

Here is the text to convert:

---
{{{input}}}
---
`,
});

const convertTextToTeamsJsonFlow = ai.defineFlow(
  {
    name: 'convertTextToTeamsJsonFlow',
    inputSchema: ConvertTextToTeamsJsonInputSchema,
    outputSchema: ConvertTextToTeamsJsonOutputSchema,
  },
  async input => {
    // We pass the raw string input directly to the prompt.
    // The 'input' key in the handlebars template refers to the entire string payload.
    const { output } = await convertTextToTeamsJsonPrompt(input);
    return output!;
  }
);
