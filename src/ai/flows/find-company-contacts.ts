'use server';
/**
 * @fileOverview Finds company contact information using AI.
 *
 * - findCompanyContacts - A function that searches for contacts at a given company.
 * - FindCompanyContactsInput - The input type for the findCompanyContacts function.
 * - FindCompanyContactsOutput - The return type for the findCompanyContacts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindCompanyContactsInputSchema = z.object({
  companyName: z.string().optional().describe('The name of the company to search for. This is optional.'),
  role: z.string().describe('The job role to look for (e.g., CEO, Head of HR).'),
});
export type FindCompanyContactsInput = z.infer<typeof FindCompanyContactsInputSchema>;

const FindCompanyContactsOutputSchema = z.object({
  contacts: z.array(z.object({
    name: z.string().describe("The contact's full name."),
    email: z.string().describe("The contact's email address."),
  })).describe('A list of found contacts.'),
});
export type FindCompanyContactsOutput = z.infer<typeof FindCompanyContactsOutputSchema>;


export async function findCompanyContacts(input: FindCompanyContactsInput): Promise<FindCompanyContactsOutput> {
  return findCompanyContactsFlow(input);
}

const findCompanyContactsFlow = ai.defineFlow(
  {
    name: 'findCompanyContactsFlow',
    inputSchema: FindCompanyContactsInputSchema,
    outputSchema: FindCompanyContactsOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      prompt: `You are an expert AI research assistant specializing in lead generation. Your task is to find publicly available contact information for professionals.

You must find contacts who hold the role of '${input.role}'.
${input.companyName ? `You must focus your search on the company '${input.companyName}'.` : 'You should search broadly across the web, including sources like Google and LinkedIn.'}

Return up to 5 contacts. For each contact, provide their full name and a plausible, publicly available email address. Do not invent information. If no contacts can be found from public sources, return an empty list.`,
      output: {
        schema: FindCompanyContactsOutputSchema,
      },
      config: {
        safetySettings: [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE'
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE'
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE'
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE'
            }
        ]
      }
    });
    return output!;
  }
);
