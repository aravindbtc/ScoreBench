
'use server';

/**
 * @fileOverview An AI flow to convert unstructured text into a structured JSON array of teams, using a user-provided prompt.
 *
 * - convertTextToTeamsJson - Converts a string of text into a JSON array of team objects based on user instructions.
 * - ConvertTextToTeamsJsonInput - Input type, containing the raw text and the user's custom prompt.
 * - ConvertTextToTeamsJsonOutput - Output type, a string containing a valid JSON array.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConvertTextToTeamsJsonInputSchema = z.object({
  rawText: z.string().describe('The unstructured text to be converted.'),
  userPrompt: z
    .string()
    .describe('The user-provided instructions for how to parse the text.'),
});

export type ConvertTextToTeamsJsonInput = z.infer<
  typeof ConvertTextToTeamsJsonInputSchema
>;

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
  prompt: `
You are an expert data parsing assistant. Your task is to analyze the following text based on the user's instructions and convert it into a valid JSON array of objects.

Each object in the array must have two keys: "teamName" and "projectName".

USER'S INSTRUCTIONS:
---
{{{userPrompt}}}
---

TEXT TO CONVERT:
---
{{{rawText}}}
---

Your final output must only be the JSON string. Do not include any other text, explanations, or markdown code fences.
`,
});

const convertTextToTeamsJsonFlow = ai.defineFlow(
  {
    name: 'convertTextToTeamsJsonFlow',
    inputSchema: ConvertTextToTeamsJsonInputSchema,
    outputSchema: ConvertTextToTeamsJsonOutputSchema,
  },
  async input => {
    const { output } = await convertTextToTeamsJsonPrompt(input);
    return output!;
  }
);
