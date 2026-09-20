'use server';

import { getBudgetRecommendations } from '@/ai/ai-budget-recommendations';
import {
  getSearchSuggestions,
  type SearchSuggestionsInput,
  type SearchSuggestionsOutput,
} from '@/ai/ai-search-suggestions';

export async function getAIBudgetSuggestion(
  spendingData: { summary?: string } | unknown
): Promise<{ suggestion: string } | { error: string }> {
  try {
    const financialSummary =
      spendingData && typeof spendingData === 'object' && 'summary' in spendingData
        ? String((spendingData as { summary: string }).summary)
        : JSON.stringify(spendingData, null, 2);
    const financialGoals = 'Reduce unnecessary spending and increase savings.';

    const result = await getBudgetRecommendations({
      spendingHistory: financialSummary,
      financialGoals: financialGoals,
    });

    return { suggestion: result.recommendations };
  } catch (error) {
    console.error('AI suggestion failed:', error);
    return { error: 'Failed to get AI suggestion. Please try again.' };
  }
}

/**
 * Returns AI-powered suggestions for the global search bar. Falls back to a
 * local heuristic when the model is unavailable (e.g. no API key configured),
 * so the UI always has something helpful to show.
 */
export async function getSearchAISuggestions(
  input: SearchSuggestionsInput
): Promise<SearchSuggestionsOutput & { source: 'ai' | 'fallback' }> {
  try {
    const result = await getSearchSuggestions(input);
    // Guard against the model returning hrefs that aren't real pages.
    const validHrefs = new Set(input.pages.map((p) => p.href));
    const actions = (result.actions || []).filter((a) => validHrefs.has(a.href)).slice(0, 3);
    return {
      answer: result.answer,
      actions: actions.length > 0 ? actions : localActions(input),
      source: 'ai',
    };
  } catch (error) {
    console.error('AI search suggestion failed, using fallback:', error);
    return { ...localSuggestion(input), source: 'fallback' };
  }
}

function localActions(input: SearchSuggestionsInput): SearchSuggestionsOutput['actions'] {
  const q = input.query.trim().toLowerCase();
  const matches = input.pages
    .filter((p) => p.label.toLowerCase().includes(q))
    .slice(0, 3)
    .map((p) => ({ label: `Go to ${p.label}`, href: p.href }));
  if (matches.length > 0) return matches;
  const dashboard = input.pages.find((p) => p.href === '/dashboard');
  return dashboard ? [{ label: 'Open Dashboard', href: dashboard.href }] : [];
}

function localSuggestion(input: SearchSuggestionsInput): SearchSuggestionsOutput {
  const q = input.query.trim();
  const lower = q.toLowerCase();
  const matchedCategory = input.categories.find((c) => lower.includes(c.toLowerCase()));

  let answer: string;
  if (matchedCategory) {
    answer = `Looking into "${matchedCategory}"? Open Transactions to filter by that category or check Budgets & Goals to set a limit.`;
  } else if (/budget|save|saving|goal/.test(lower)) {
    answer = `To manage budgets and savings goals, head to Budgets & Goals — you can set category limits and track progress there.`;
  } else if (/spend|expense|cost/.test(lower)) {
    answer = `You can review all spending on the Transactions page, or see the breakdown on your Dashboard.`;
  } else if (q.length > 0) {
    answer = `Here are the closest matches for "${q}". Pick a page below to jump straight there.`;
  } else {
    answer = `Type a page, category, or transaction to jump to it.`;
  }

  return { answer, actions: localActions(input) };
}
