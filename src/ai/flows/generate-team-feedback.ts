'use server';

/**
 * @fileOverview AI-powered feedback generation for team evaluations.
 *
 * - generateTeamFeedback - A function that generates one-line feedback for a team based on jury scores.
 * - GenerateTeamFeedbackInput - The input type for the generateTeamFeedback function, accepting a dynamic map of scores.
 * - GenerateTeamFeedbackOutput - The return type, providing a one-line feedback summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input is a dynamic map of criteria names to scores.
const GenerateTeamFeedbackInputSchema = z.record(z.string(), z.number());

export type GenerateTeamFeedbackInput = z.infer<
  typeof GenerateTeamFeedbackInputSchema
>;

const GenerateTeamFeedbackOutputSchema = z.object({
  feedback: z
    .string()
    .describe(
      'A one-line feedback summary based on the provided scores.'
    ),
});

export type GenerateTeamFeedbackOutput = z.infer<
  typeof GenerateTeamFeedbackOutputSchema
>;

export async function generateTeamFeedback(
  input: GenerateTeamFeedbackInput
): Promise<GenerateTeamFeedbackOutput> {
  return generateTeamFeedbackFlow(input);
}

const generateTeamFeedbackPrompt = ai.definePrompt({
  name: 'generateTeamFeedbackPrompt',
  input: { schema: GenerateTeamFeedbackInputSchema },
  output: { schema: GenerateTeamFeedbackOutputSchema },
  prompt: `You are an AI assistant providing feedback to hackathon teams. Based on the scores provided by a judge for the team's performance across different criteria, generate a concise one-line feedback summary. The feedback should highlight both strengths and areas for improvement.

The scores are out of 10. Here are the scores provided by the judge:

{{#each .}}
- {{ @key }}: {{ this }}
{{/each}}

Feedback:`,
});

const generateTeamFeedbackFlow = ai.defineFlow(
  {
    name: 'generateTeamFeedbackFlow',
    inputSchema: GenerateTeamFeedbackInputSchema,
    outputSchema: GenerateTeamFeedbackOutputSchema,
  },
  async input => {
    const { output } = await generateTeamFeedbackPrompt(input);
    return output!;
  }
);
