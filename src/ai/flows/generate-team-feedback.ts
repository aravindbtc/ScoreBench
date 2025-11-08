'use server';

/**
 * @fileOverview AI-powered feedback generation for team evaluations.
 *
 * - generateTeamFeedback - A function that generates one-line feedback for a team based on jury scores.
 * - GenerateTeamFeedbackInput - The input type for the generateTeamFeedback function, including scores for various criteria.
 * - GenerateTeamFeedbackOutput - The return type for the generateTeamFeedback function, providing a one-line feedback summary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTeamFeedbackInputSchema = z.object({
  innovation: z
    .number()
    .min(1)
    .max(10)
    .describe('Score for Innovation / Novelty (1-10).'),
  relevance: z
    .number()
    .min(1)
    .max(10)
    .describe('Score for Problem Relevance (1-10).'),
  technical: z
    .number()
    .min(1)
    .max(10)
    .describe('Score for Technical Implementation (1-10).'),
  presentation: z
    .number()
    .min(1)
    .max(10)
    .describe('Score for Presentation & Communication (1-10).'),
  feasibility: z
    .number()
    .min(1)
    .max(10)
    .describe('Score for Scalability & Feasibility (1-10).'),
});

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
  input: {schema: GenerateTeamFeedbackInputSchema},
  output: {schema: GenerateTeamFeedbackOutputSchema},
  prompt: `You are an AI assistant providing feedback to hackathon teams. Based on the scores provided by a judge for the team's performance across different criteria, generate a concise one-line feedback summary. The feedback should highlight both strengths and areas for improvement.

Scores:
- Innovation: {{innovation}}
- Relevance: {{relevance}}
- Technical: {{technical}}
- Presentation: {{presentation}}
- Feasibility: {{feasibility}}

Feedback:`,
});

const generateTeamFeedbackFlow = ai.defineFlow(
  {
    name: 'generateTeamFeedbackFlow',
    inputSchema: GenerateTeamFeedbackInputSchema,
    outputSchema: GenerateTeamFeedbackOutputSchema,
  },
  async input => {
    const {output} = await generateTeamFeedbackPrompt(input);
    return output!;
  }
);
