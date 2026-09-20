'use server';

/**
 * @fileOverview AI-powered suggestions for the global dashboard search bar.
 *
 * Given a free-text query and lightweight app context (the pages the user can
 * navigate to and a short summary of their recent transactions), this returns a
 * concise natural-language answer plus a handful of suggested navigation
 * actions. Used by the command palette in the app shell.
 *
 * - getSearchSuggestions - Runs the flow and returns structured suggestions.
 * - SearchSuggestionsInput / SearchSuggestionsOutput - IO types.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchSuggestionsInputSchema = z.object({
  query: z.string().describe('The raw text the user typed into the search bar.'),
  pages: z
    .array(z.object({ label: z.string(), href: z.string() }))
    .describe('The pages the user can navigate to.'),
  categories: z.array(z.string()).describe('The available transaction categories.'),
  recentTransactions: z
    .string()
    .describe('A short JSON summary of the user’s recent transactions.'),
});
export type SearchSuggestionsInput = z.infer<typeof SearchSuggestionsInputSchema>;

const SearchSuggestionsOutputSchema = z.object({
  answer: z
    .string()
    .describe('A one or two sentence, friendly answer or insight for the query.'),
  actions: z
    .array(
      z.object({
        label: z.string().describe('A short, clear label for the suggested action.'),
        href: z
          .string()
          .describe('One of the provided page hrefs the action should navigate to.'),
      })
    )
    .describe('Up to three suggested navigation actions, most relevant first.'),
});
export type SearchSuggestionsOutput = z.infer<typeof SearchSuggestionsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'searchSuggestionsPrompt',
  input: { schema: SearchSuggestionsInputSchema },
  output: { schema: SearchSuggestionsOutputSchema },
  prompt: `You are the built-in AI assistant for "Finlo Flash", a personal finance dashboard.
The user typed a query into the global search bar. Help them get where they want to go
and give a short, useful financial insight when relevant.

Rules:
- Keep "answer" to one or two friendly sentences. Never invent exact numbers you were not given.
- Every action "href" MUST be copied exactly from the "Available pages" list below. Do not make up routes.
- Return at most three actions, ordered by relevance. Prefer fewer, high-quality actions.
- If the query is about spending, budgets, saving, or a category, point them to the most relevant page.

User query: {{{query}}}

Available pages:
{{#each pages}}- {{this.label}} -> {{this.href}}
{{/each}}

Transaction categories: {{#each categories}}{{this}}, {{/each}}

Recent transactions summary (JSON): {{{recentTransactions}}}
`,
});

const searchSuggestionsFlow = ai.defineFlow(
  {
    name: 'searchSuggestionsFlow',
    inputSchema: SearchSuggestionsInputSchema,
    outputSchema: SearchSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function getSearchSuggestions(
  input: SearchSuggestionsInput
): Promise<SearchSuggestionsOutput> {
  return searchSuggestionsFlow(input);
}
