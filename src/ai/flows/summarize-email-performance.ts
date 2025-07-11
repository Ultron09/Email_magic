// Summarize Email Performance
'use server';
/**
 * @fileOverview Summarizes the performance of sent emails based on provided metrics.
 *
 * - summarizeEmailPerformance - A function that takes email performance metrics and returns a summary.
 * - SummarizeEmailPerformanceInput - The input type for the summarizeEmailPerformance function.
 * - SummarizeEmailPerformanceOutput - The return type for the summarizeEmailPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEmailPerformanceInputSchema = z.object({
  deliveries: z.number().describe('The number of emails successfully delivered.'),
  opens: z.number().describe('The number of emails opened by recipients.'),
  bounces: z.number().describe('The number of emails that bounced or failed to deliver.'),
  totalSent: z.number().describe('The total number of emails sent.'),
});
export type SummarizeEmailPerformanceInput = z.infer<
  typeof SummarizeEmailPerformanceInputSchema
>;

const SummarizeEmailPerformanceOutputSchema = z.object({
  summary: z.string().describe('A summary of the email campaign performance.'),
});
export type SummarizeEmailPerformanceOutput = z.infer<
  typeof SummarizeEmailPerformanceOutputSchema
>;

export async function summarizeEmailPerformance(
  input: SummarizeEmailPerformanceInput
): Promise<SummarizeEmailPerformanceOutput> {
  return summarizeEmailPerformanceFlow(input);
}

const summarizeEmailPerformancePrompt = ai.definePrompt({
  name: 'summarizeEmailPerformancePrompt',
  input: {schema: SummarizeEmailPerformanceInputSchema},
  output: {schema: SummarizeEmailPerformanceOutputSchema},
  prompt: `You are an expert email marketing analyst. Given the following email campaign metrics, provide a concise summary of the campaign's performance.

Deliveries: {{{deliveries}}}
Opens: {{{opens}}}
Bounces: {{{bounces}}}
Total Sent: {{{totalSent}}}

Please provide a summary of the email performance.`,
});

const summarizeEmailPerformanceFlow = ai.defineFlow(
  {
    name: 'summarizeEmailPerformanceFlow',
    inputSchema: SummarizeEmailPerformanceInputSchema,
    outputSchema: SummarizeEmailPerformanceOutputSchema,
  },
  async input => {
    const {output} = await summarizeEmailPerformancePrompt(input);
    return output!;
  }
);
