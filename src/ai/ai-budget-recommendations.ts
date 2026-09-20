// Use server directive is necessary for Genkit flows.
'use server';

/**
 * @fileOverview Provides AI-powered budget recommendations based on past spending habits.
 *
 * - getBudgetRecommendations - A function that returns budget recommendations.
 * - BudgetRecommendationsInput - The input type for the getBudgetRecommendations function.
 * - BudgetRecommendationsOutput - The return type for the getBudgetRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetRecommendationsInputSchema = z.object({
  spendingHistory: z.string().describe('The user spending history in JSON format.  Include category and amount.'),
  financialGoals: z.string().describe('The user\u2019s financial goals.'),
});
export type BudgetRecommendationsInput = z.infer<typeof BudgetRecommendationsInputSchema>;

const BudgetRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('AI-powered budget recommendations.'),
});
export type BudgetRecommendationsOutput = z.infer<typeof BudgetRecommendationsOutputSchema>;

export async function getBudgetRecommendations(input: BudgetRecommendationsInput): Promise<BudgetRecommendationsOutput> {
  return budgetRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetRecommendationsPrompt',
  input: {schema: BudgetRecommendationsInputSchema},
  output: {schema: BudgetRecommendationsOutputSchema},
  prompt: `You are a personal finance advisor. Using the spending summary and goals below, give 3 to 4 short, specific recommendations.

Rules:
- Reference the user's real numbers and category names from the summary.
- Keep each recommendation to one or two plain sentences.
- Do not use em dashes, markdown, headings, or bullet symbols.
- Separate each recommendation with a blank line.
- End with one concrete next step the user can take in the app (setting a budget on the Budgets page).

Spending summary:
{{{spendingHistory}}}

Financial goals: {{{financialGoals}}}
`,
});

const budgetRecommendationsFlow = ai.defineFlow(
  {
    name: 'budgetRecommendationsFlow',
    inputSchema: BudgetRecommendationsInputSchema,
    outputSchema: BudgetRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
