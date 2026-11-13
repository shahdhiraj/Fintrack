
import * as React from 'react';
import { useRouter } from '@/lib/navigation';
import {
  Search,
  CornerDownLeft,
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  Tag,
  Compass,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTransaction } from '@/context/transaction-context';
import { categories } from '@/lib/types';
import { getSearchAISuggestions } from '@/lib/actions';
import type { SearchSuggestionsOutput } from '@/lib/actions';

export type SearchPage = { label: string; href: string };

type ResultItem = {
  id: string;
  type: 'page' | 'category' | 'transaction';
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const iconForType = {
  page: Compass,
  category: Tag,
  transaction: FileText,
} as const;

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function GlobalSearch({
  pages,
  isCollapsed,
}: {
  pages: SearchPage[];
  isCollapsed?: boolean;
}) {
  const router = useRouter();
  const { transactions } = useTransaction();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // AI suggestion state
  const [ai, setAi] = React.useState<(SearchSuggestionsOutput & { source: 'ai' | 'fallback' }) | null>(
    null
  );
  const [aiLoading, setAiLoading] = React.useState(false);

  // Global ⌘K / Ctrl+K shortcut to open the palette.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Reset state whenever the palette opens.
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setAi(null);
      // Focus after the dialog mounts.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Instant, local results.
  const results = React.useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase();

    const pageResults: ResultItem[] = pages
      .filter((p) => !q || p.label.toLowerCase().includes(q))
      .map((p) => ({
        id: `page:${p.href}`,
        type: 'page',
        label: p.label,
        sublabel: 'Page',
        href: p.href,
        icon: iconForType.page,
      }));

    const categoryResults: ResultItem[] = q
      ? categories
          .filter((c) => c.toLowerCase().includes(q))
          .map((c) => ({
            id: `category:${c}`,
            type: 'category',
            label: c,
            sublabel: 'Category',
            href: `/transactions?category=${encodeURIComponent(c)}`,
            icon: iconForType.category,
          }))
      : [];

    const transactionResults: ResultItem[] = q
      ? transactions
          .filter(
            (t) =>
              t.description.toLowerCase().includes(q) ||
              t.category.toLowerCase().includes(q)
          )
          .slice(0, 6)
          .map((t) => ({
            id: `tx:${t.id}`,
            type: 'transaction',
            label: t.description,
            sublabel: `${t.category} · ${t.type === 'income' ? '+' : '-'}${formatCurrency(
              t.amount
            )}`,
            href: `/transactions?q=${encodeURIComponent(t.description)}`,
            icon: iconForType.transaction,
          }))
      : [];

    return [...pageResults, ...categoryResults, ...transactionResults];
  }, [query, pages, transactions]);

  // Keep the highlighted row valid as results change.
  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Debounced AI suggestions.
  React.useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setAi(null);
      setAiLoading(false);
      return;
    }
    setAiLoading(true);
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const recent = transactions.slice(0, 12).map((t) => ({
          description: t.description,
          category: t.category,
          type: t.type,
          amount: t.amount,
        }));
        const res = await getSearchAISuggestions({
          query: q,
          pages,
          categories: [...categories],
          recentTransactions: JSON.stringify(recent),
        });
        // Ignore stale responses if the query moved on / palette closed.
        if (!cancelled) setAi(res);
      } catch {
        if (!cancelled) setAi(null);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open, pages, transactions]);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) go(item.href);
      else if (ai?.actions?.[0]) go(ai.actions[0].href);
    }
  };

  return (
    <>
      {/* Trigger — matches the sidebar search styling */}
      {isCollapsed ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
          title="Search (⌘K)"
        >
          <Search className="h-4 w-4" />
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative w-full text-left"
        >
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex h-8 items-center rounded-lg border border-border/40 bg-muted/40 pl-8 pr-8 text-xs text-muted-foreground">
            Search
          </span>
          <kbd className="absolute right-2 top-2 text-[9px] text-muted-foreground font-mono bg-background border px-1 rounded">
            ⌘ K
          </kbd>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[12%] translate-y-0 max-w-xl gap-0 overflow-hidden p-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Search FinTrack</DialogTitle>

          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border/60 px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search pages, transactions, or ask a question…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex text-[10px] text-muted-foreground font-mono bg-muted border px-1.5 py-0.5 rounded">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Instant results */}
            {results.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Results
                </p>
                <ul>
                  {results.map((item, idx) => {
                    const Icon = item.icon;
                    const active = idx === activeIndex;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => go(item.href)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                            active ? 'bg-emerald-500/10 text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                          )}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block truncate font-medium text-foreground">{item.label}</span>
                            {item.sublabel && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.sublabel}
                              </span>
                            )}
                          </span>
                          {active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* AI suggestions */}
            {query.trim().length >= 2 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    AI Suggestion
                  </p>
                  {aiLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  {ai?.source === 'fallback' && (
                    <span className="ml-auto text-[9px] text-muted-foreground">offline mode</span>
                  )}
                </div>

                {aiLoading && !ai ? (
                  <p className="text-sm text-muted-foreground">Thinking…</p>
                ) : ai ? (
                  <>
                    <p className="text-sm text-foreground/90">{ai.answer}</p>
                    {ai.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ai.actions.map((a, i) => (
                          <button
                            key={`${a.href}-${i}`}
                            type="button"
                            onClick={() => go(a.href)}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-background px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                          >
                            {a.label}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

            {/* Empty state */}
            {results.length === 0 && query.trim().length < 2 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Search for pages, transactions, or categories — or ask a question.
              </p>
            )}
            {results.length === 0 && query.trim().length >= 2 && !aiLoading && !ai && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No direct matches for “{query.trim()}”.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
