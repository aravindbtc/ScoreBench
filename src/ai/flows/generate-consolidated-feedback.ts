
'use server';

/**
 * @fileOverview AI-powered consolidated feedback generation for hackathon teams.
 *
 * - generateConsolidatedFeedback - Generates a comprehensive feedback summary from multiple jury panels.
 * - GenerateConsolidatedFeedbackInput - Input type, containing optional data from up to three panels.
 * - GenerateConsolidatedFeedbackOutput - Return type, providing a single consolidated feedback string.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// PanelScore now accepts a dynamic record for scores
const PanelScoreSchema = z.object({
  scores: z.record(z.string(), z.number()),
  total: z.number(),
  remarks: z.string(),
});

const GenerateConsolidatedFeedbackInputSchema = z.object({
  panel1: PanelScoreSchema.optional(),
  panel2: PanelScoreSchema.optional(),
  panel3: PanelScoreSchema.optional(),
});

export type GenerateConsolidatedFeedbackInput = z.infer<
  typeof GenerateConsolidatedFeedbackInputSchema
>;

const GenerateConsolidatedFeedbackOutputSchema = z.object({
  feedback: z
    .string()
    .describe(
      'A consolidated feedback summary based on all available panel scores and remarks.'
    ),
});

export type GenerateConsolidatedFeedbackOutput = z.infer<
  typeof GenerateConsolidatedFeedbackOutputSchema
>;

export async function generateConsolidatedFeedback(
  input: GenerateConsolidatedFeedbackInput
): Promise<GenerateConsolidatedFeedbackOutput> {
  return generateConsolidatedFeedbackFlow(input);
}

const generateConsolidatedFeedbackPrompt = ai.definePrompt({
  name: 'generateConsolidatedFeedbackPrompt',
  input: { schema: GenerateConsolidatedFeedbackInputSchema },
  output: { schema: GenerateConsolidatedFeedbackOutputSchema },
  prompt: `You are the head judge of a hackathon. Your task is to synthesize the feedback from multiple jury panels into a single, consolidated summary for a team.

Analyze the scores and remarks provided by each panel. Identify common themes, strengths, and weaknesses. Provide a final, conclusive summary that encapsulates the overall performance and potential of the project.

Here is the data from the panels:

{{#if panel1}}
Panel 1 Scores:
{{#each panel1.scores}}
- {{ @key }}: {{ this }}
{{/each}}
- TOTAL: {{panel1.total}}
Panel 1 Remarks: "{{panel1.remarks}}"
{{/if}}

{{#if panel2}}
Panel 2 Scores:
{{#each panel2.scores}}
- {{ @key }}: {{ this }}
{{/each}}
- TOTAL: {{panel2.total}}
Panel 2 Remarks: "{{panel2.remarks}}"
{{/if}}

{{#if panel3}}
Panel 3 Scores:
{{#each panel3.scores}}
- {{ @key }}: {{ this }}
{{/each}}
- TOTAL: {{panel3.total}}
Panel 3 Remarks: "{{panel3.remarks}}"
{{/if}}

Consolidated Summary:`,
});

const generateConsolidatedFeedbackFlow = ai.defineFlow(
  {
    name: 'generateConsolidatedFeedbackFlow',
    inputSchema: GenerateConsolidatedFeedbackInputSchema,
    outputSchema: GenerateConsolidatedFeedbackOutputSchema,
  },
  async input => {
    const { output } = await generateConsolidatedFeedbackPrompt(input);
    return output!;
  }
);
