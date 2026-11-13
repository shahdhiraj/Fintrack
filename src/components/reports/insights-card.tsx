import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Eye, Lightbulb, Sparkles, type LucideIcon } from 'lucide-react';
import Link from '@/components/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Insight, InsightTone } from '@/lib/report-insights';

const TONE: Record<InsightTone, { icon: LucideIcon; label: string; chip: string; bar: string }> = {
  alert: { icon: AlertTriangle, label: 'Act now', chip: 'bg-destructive/10 text-destructive', bar: 'bg-destructive' },
  warn: { icon: Eye, label: 'Watch', chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  tip: { icon: Lightbulb, label: 'Idea', chip: 'bg-primary/10 text-primary', bar: 'bg-primary' },
  good: { icon: CheckCircle2, label: 'Going well', chip: 'bg-primary/10 text-primary', bar: 'bg-primary' },
};

const VISIBLE = 4;

/** Suggestion report for the selected month. Computed on the device, not by a hosted model. */
export function InsightsCard({ headline, insights, monthLabel }: { headline: string; insights: Insight[]; monthLabel: string }) {
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? insights : insights.slice(0, VISIBLE);
  const counts = insights.reduce<Record<InsightTone, number>>((acc, i) => ({ ...acc, [i.tone]: acc[i.tone] + 1 }), {
    alert: 0,
    warn: 0,
    tip: 0,
    good: 0,
  });

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-base">Suggestions for {monthLabel}</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">{headline}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Suggestion summary">
            {(Object.keys(counts) as InsightTone[])
              .filter((t) => counts[t] > 0)
              .map((t) => (
                <span key={t} className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', TONE[t].chip)}>
                  {counts[t]} {TONE[t].label.toLowerCase()}
                </span>
              ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5">
        <ul className="grid gap-2.5 lg:grid-cols-2">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((i, idx) => {
              const tone = TONE[i.tone];
              const Icon = tone.icon;
              return (
                <motion.li
                  key={i.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 24, delay: reduce ? 0 : Math.min(idx, VISIBLE) * 0.05 }}
                  className="group relative flex gap-3 overflow-hidden rounded-xl border border-border/60 bg-background/60 p-3.5 pl-4 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_28px_-20px_hsl(var(--primary)/0.6)] motion-reduce:transform-none"
                >
                  <span className={cn('absolute inset-y-0 left-0 w-1', tone.bar)} aria-hidden="true" />
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tone.chip)}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{tone.label}</p>
                    <p className="text-sm font-semibold leading-snug">{i.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.detail}</p>
                    {i.action && (
                      <Link
                        href={i.action.href}
                        className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        {i.action.label}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground">Worked out on your device from this month's transactions, last month and your budget limits.</p>
          {insights.length > VISIBLE && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline sm:self-auto"
            >
              {expanded ? 'Show fewer' : `Show all ${insights.length}`}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
