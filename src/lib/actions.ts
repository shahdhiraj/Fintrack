/**
 * Suggestion helpers for the AI Budget Advisor and the search palette.
 *
 * These used to call Gemini through Genkit in Next.js server actions. The Vite
 * build is browser-only, and calling Gemini from the browser would expose the
 * API key, so they now return on-device suggestions immediately. To bring the
 * model back, put these calls behind a small backend (e.g. a Firebase Cloud
 * Function) and call it from here; the signatures can stay the same.
 */

export type SearchSuggestionsInput = {
  query: string;
  pages: { label: string; href: string }[];
  categories: string[];
  /** Short JSON summary of recent transactions (kept for a future AI backend). */
  recentTransactions: string;
};

export type SearchSuggestionsOutput = {
  answer: string;
  actions: { label: string; href: string }[];
};

/**
 * Budget advice. Returns an error so the advisor falls back to its built-in,
 * data-driven advice (see `buildLocalAdvice` in budget-insights.ts).
 */
export async function getAIBudgetSuggestion(_spendingData: unknown): Promise<{ suggestion: string } | { error: string }> {
  return { error: 'AI service not configured; using on-device advice.' };
}

export async function getSearchAISuggestions(
  input: SearchSuggestionsInput
): Promise<SearchSuggestionsOutput & { source: 'ai' | 'fallback' }> {
  return { ...localSuggestion(input), source: 'fallback' };
}

function localActions(input: SearchSuggestionsInput): SearchSuggestionsOutput['actions'] {
  const q = input.query.trim().toLowerCase();
  const matches = input.pages
    .filter((p) => p.label.toLowerCase().includes(q))
    .slice(0, 3)
    .map((p) => ({ label: `Go to ${p.label}`, href: p.href }));
  if (matches.length > 0) return matches;

  // Keyword hints for common intents.
  const hint = (href: string, label: string) => (input.pages.some((p) => p.href === href) ? [{ label, href }] : []);
  if (/bill|subscription|rent|due/.test(q)) return hint('/recurring', 'Open Recurring Bills');
  if (/wallet|account|card|cash|transfer|balance/.test(q)) return hint('/wallets', 'Open Wallets');
  if (/budget|limit|goal|save/.test(q)) return hint('/budgets', 'Open Budgets & Goals');
  if (/report|chart|month|trend/.test(q)) return hint('/reports', 'Open Reports');
  if (/help|how|faq|support/.test(q)) return hint('/help', 'Open Help Desk');
  if (/setting|theme|export|password|profile/.test(q)) return hint('/settings', 'Open Settings');
  return hint('/dashboard', 'Open Dashboard');
}

function localSuggestion(input: SearchSuggestionsInput): SearchSuggestionsOutput {
  const q = input.query.trim();
  const lower = q.toLowerCase();
  const matchedCategory = input.categories.find((c) => lower.includes(c.toLowerCase()));

  let answer: string;
  if (matchedCategory) {
    answer = `Looking into "${matchedCategory}"? Open Transactions to filter by that category, or set a limit in Budgets & Goals.`;
  } else if (/budget|save|saving|goal/.test(lower)) {
    answer = 'Set category limits and track progress in Budgets & Goals. Limits carry over month to month.';
  } else if (/bill|subscription|due/.test(lower)) {
    answer = 'Recurring Bills shows what is due, with reminders and one-click payment.';
  } else if (/wallet|transfer|balance/.test(lower)) {
    answer = 'Wallets shows a live balance for each account and lets you move money between them.';
  } else if (/spend|expense|cost/.test(lower)) {
    answer = 'Review all spending on the Transactions page, or see the breakdown on your Dashboard and in Reports.';
  } else if (q.length > 0) {
    answer = `Here are the closest matches for "${q}".`;
  } else {
    answer = 'Type a page, category, or transaction to jump to it.';
  }

  return { answer, actions: localActions(input) };
}
