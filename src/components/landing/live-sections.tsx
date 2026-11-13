import { memo, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, CornerDownLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_LIMITS } from '@/lib/budgets';
import { Reveal, RevealText } from './reveal';

const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const;
const SURFACE = 'chrome-stroke [--chrome-fill:hsl(var(--background))] rounded-[1.75rem] border border-border bg-background';

/* ------------------------------------------------------------ bento cells */
/* Each cell owns its own timer and is memoized, so the loops never re-render the page. */

const QUERIES = [
  { text: 'groceries last month', result: 'Groceries: $486.20 across 9 transactions' },
  { text: 'add expense', result: 'Open the quick add form' },
  { text: 'internet bill', result: 'Internet: due in 3 days, $59.98' },
];

const SearchCell = memo(function SearchCell() {
  const reduce = useReducedMotion();
  const [q, setQ] = useState(0);
  const [n, setN] = useState(0);
  const full = QUERIES[q].text.length;
  const shown = reduce ? full : n;

  useEffect(() => {
    if (reduce) return;
    const t = window.setTimeout(
      () => {
        if (n < full) setN(n + 1);
        else {
          setN(0);
          setQ((q + 1) % QUERIES.length);
        }
      },
      n < full ? 70 : 2400,
    );
    return () => window.clearTimeout(t);
  }, [n, q, full, reduce]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 truncate text-sm">
          {QUERIES[q].text.slice(0, shown)}
          <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-primary motion-safe:animate-pulse" />
        </span>
      </div>
      <div className="h-14">
        <AnimatePresence>
          {shown === full && (
            <motion.div
              key={q}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="flex items-center justify-between gap-3 rounded-2xl bg-primary/10 px-5 py-4 text-sm font-medium text-primary"
            >
              <span className="truncate">{QUERIES[q].result}</span>
              <CornerDownLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

const BILLS = [
  { name: 'Rent', when: 'Tomorrow', soon: true },
  { name: 'Internet', when: 'In 3 days', soon: false },
  { name: 'Streaming', when: 'In 11 days', soon: false },
];

const BillsCell = memo(function BillsCell() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (reduce) return;
    const t = window.setTimeout(() => setShow((s) => !s), show ? 3000 : 1600);
    return () => window.clearTimeout(t);
  }, [show, reduce]);

  return (
    <div className="relative pt-12">
      <div className="absolute right-0 top-0 h-10">
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 16 }}
              className="chrome-green flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              Rent is due tomorrow
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ul className="divide-y divide-border">
        {BILLS.map((b) => (
          <li key={b.name} className="flex items-center justify-between py-3.5 text-sm">
            <span className="flex items-center gap-3 font-medium">
              <span className={cn('h-2 w-2 rounded-full', b.soon ? 'bg-destructive motion-safe:animate-pulse' : 'bg-muted-foreground/30')} />
              {b.name}
            </span>
            <span className={cn('tabular', b.soon ? 'font-semibold text-destructive' : 'text-muted-foreground')}>{b.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

const SPEND_STEPS = [190, 320, 460, 540];
const LIMIT = 500;

const LimitCell = memo(function LimitCell() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(reduce ? 1 : 0);
  const spent = SPEND_STEPS[i];
  const over = spent > LIMIT;

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % SPEND_STEPS.length), 2200);
    return () => window.clearInterval(t);
  }, [reduce]);

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">Groceries</span>
        <span className={cn('font-display text-3xl font-bold tabular', over && 'text-destructive')}>${spent}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          animate={{ scaleX: Math.min(spent / LIMIT, 1) }}
          transition={SPRING}
          className={cn('h-full origin-left rounded-full transition-colors', over ? 'bg-destructive' : 'bg-primary')}
        />
      </div>
      <p className="text-sm text-muted-foreground tabular">
        {over ? `$${spent - LIMIT} over the $${LIMIT} limit` : `$${LIMIT - spent} left of $${LIMIT}`}
      </p>
    </div>
  );
});

const CATEGORY_CHIPS = Object.entries(DEFAULT_LIMITS);

function Chips() {
  return (
    <>
      {CATEGORY_CHIPS.map(([name, limit]) => (
        <span key={name} className="flex shrink-0 items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm">
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground tabular">${limit.toLocaleString('en-US')}</span>
        </span>
      ))}
    </>
  );
}

const CategoryCell = memo(function CategoryCell() {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className="flex flex-wrap gap-3">
        <Chips />
      </div>
    );
  }
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <motion.div
        className="flex w-max gap-3 pr-3"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 45, ease: 'linear', repeat: Infinity }}
      >
        <Chips />
        <span className="flex gap-3" aria-hidden="true">
          <Chips />
        </span>
      </motion.div>
    </div>
  );
});

function Cell({ className, title, body, children }: { className?: string; title: string; body: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={SPRING}
      className={cn('flex flex-col gap-5', className)}
    >
      <div className={cn(SURFACE, 'flex min-h-[240px] flex-1 flex-col justify-center p-8 sm:p-10 transition-[border-color,box-shadow] duration-300 hover:-translate-y-1 motion-reduce:transform-none hover:shadow-[0_20px_40px_-24px_hsl(var(--primary)/0.35)]')}>{children}</div>
      <div className="space-y-1 px-2">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </motion.div>
  );
}

/** Bento of small live demos, one per thing the app does for you during the month. */
export function LiveBento() {
  return (
    <section id="features" className="px-4 sm:px-6 lg:px-8 py-24 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto space-y-14">
        <div className="max-w-2xl space-y-4">
          <RevealText
            className="font-display font-bold tracking-tight text-4xl sm:text-5xl leading-[1.08]"
            text="It keeps watch, so you can stop checking."
          />
          <Reveal as="p" className="text-muted-foreground leading-relaxed">
            Four small things FinTrack does through the month. Every example below uses sample numbers.
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-12">
          <Cell
            className="lg:col-span-7"
            title="Find anything from one search box"
            body="Type a category, a bill or a page name and jump straight to it."
          >
            <SearchCell />
          </Cell>
          <Cell
            className="lg:col-span-5"
            title="Bills that speak up"
            body="Recurring bills show up before they are due, not after."
          >
            <BillsCell />
          </Cell>
          <Cell
            className="lg:col-span-5"
            title="Limits you can see filling"
            body="Each expense moves the bar. Past the limit, it turns red."
          >
            <LimitCell />
          </Cell>
          <Cell
            className="lg:col-span-7"
            title="15 categories, ready on day one"
            body="Each starts with a suggested monthly limit that you can change to fit your life."
          >
            <CategoryCell />
          </Cell>
        </div>
      </div>
    </section>
  );
}
