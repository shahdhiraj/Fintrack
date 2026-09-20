'use client';

import { useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getAIBudgetSuggestion } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransaction } from '@/context/transaction-context';
import { analyzeSpending, summaryForModel, buildLocalAdvice } from '@/lib/budget-insights';

function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n|\n/)
    .map((p) => p.replace(/^[\s*\-•\d.]+/, '').trim())
    .filter(Boolean);
}

export function AiBudgetAssistant() {
  const [advice, setAdvice] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const { transactions } = useTransaction();

  const summary = useMemo(() => analyzeSpending(transactions), [transactions]);

  const generate = () => {
    startTransition(async () => {
      const local = buildLocalAdvice(summary);
      try {
        const result = await getAIBudgetSuggestion({ summary: summaryForModel(summary) });
        if ('suggestion' in result && result.suggestion.trim()) {
          const paras = toParagraphs(result.suggestion);
          setAdvice(paras.length ? paras : local);
        } else {
          setAdvice(local);
        }
      } catch {
        setAdvice(local);
      }
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </span>
          AI Budget Advisor
        </CardTitle>
        <CardDescription>
          Get personalized recommendations to improve your spending habits.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        {isPending ? (
          <div className="space-y-3" aria-live="polite">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : advice ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3" aria-live="polite">
            {advice.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-1">
            <p className="text-sm font-medium">No insight yet</p>
            <p className="text-xs text-muted-foreground">
              {summary.count === 0
                ? 'Add some transactions, then generate advice tailored to your spending.'
                : 'Analyze your spending to see where you can save.'}
            </p>
          </div>
        )}

        <Button onClick={generate} disabled={isPending} className="w-full gap-2">
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing your spending...
            </>
          ) : advice ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Get another tip
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate insight
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
