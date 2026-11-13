import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, ArrowRight, BarChart3, LayoutGrid, Repeat, Target, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, RevealText } from './reveal';

const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const;

type Area = { id: string; label: string; icon: LucideIcon; title: string; body: string; points: string[] };

const AREAS: Area[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    title: 'The whole month on one screen',
    body: 'Income, expenses and what you kept, next to your cash flow, your spending breakdown and the bills coming up.',
    points: ['Monthly totals', 'Cash flow chart', 'Upcoming bills'],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
    title: 'Every dollar in and out',
    body: 'Add income or an expense in a few taps, then search, sort and filter the full list whenever you need to check something.',
    points: ['Quick add', 'Search and filter', 'CSV export'],
  },
  {
    id: 'budgets',
    label: 'Budgets & Goals',
    icon: Target,
    title: 'A limit for each category',
    body: 'Set what each category is worth this month. A bar fills as you spend and turns red the moment you pass the limit.',
    points: ['15 categories', 'Monthly limits', 'Over-limit alerts'],
  },
  {
    id: 'wallets',
    label: 'Wallets',
    icon: Wallet,
    title: 'All your accounts, one total',
    body: 'Track every account, card and cash pocket, and move money between them without losing track of the balance.',
    points: ['Multiple wallets', 'Transfers', 'Running balances'],
  },
  {
    id: 'recurring',
    label: 'Recurring Bills',
    icon: Repeat,
    title: 'Bills you never forget',
    body: 'Rent, subscriptions and utilities live in one list. See what is due next and mark each one paid when it leaves your account.',
    points: ['Due dates', 'Mark as paid', 'Reminders'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    title: 'See where the money went',
    body: 'Compare income with expenses month by month, and break your spending down by category to find what keeps growing.',
    points: ['Income vs expense', 'Category breakdown', 'Month comparison'],
  },
];

function Tile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('rounded-2xl p-4', strong ? 'chrome-green bg-primary text-primary-foreground' : 'border border-border')}>
      <p className={cn('text-xs', strong ? 'opacity-90' : 'text-muted-foreground')}>{label}</p>
      <p className="mt-1 font-display font-bold text-xl tabular">{value}</p>
    </div>
  );
}

function Row({ left, sub, right, tone }: { left: string; sub: string; right: ReactNode; tone?: 'in' | 'out' | 'over' }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{left}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className={cn('shrink-0 text-sm font-semibold tabular', tone === 'in' && 'text-primary', tone === 'over' && 'text-destructive')}>
        {right}
      </div>
    </div>
  );
}

function Bars({ pairs }: { pairs: [number, number?][] }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-32 items-end gap-3">
      {pairs.map(([a, b], i) => (
        <div key={i} className="flex h-full flex-1 items-end gap-1">
          {[a, b].map((v, j) =>
            v === undefined ? null : (
              <motion.div
                key={j}
                initial={reduce ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...SPRING, delay: i * 0.05 }}
                style={{ height: `${v}%` }}
                className={cn('flex-1 origin-bottom rounded-t-md', j === 0 ? 'bg-primary' : 'bg-muted-foreground/30')}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

function Meter({ label, amount, pct, over }: { label: string; amount: string; pct: number; over?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn('tabular', over ? 'font-semibold text-destructive' : 'text-muted-foreground')}>{amount}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: Math.min(pct, 100) / 100 }}
          transition={SPRING}
          className={cn('h-full origin-left rounded-full', over ? 'bg-destructive' : 'bg-primary')}
        />
      </div>
    </div>
  );
}

function Preview({ id }: { id: string }) {
  switch (id) {
    case 'dashboard':
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label="Income" value="$8,450" />
            <Tile label="Expenses" value="$3,120" />
            <Tile label="Kept" value="$5,330" strong />
          </div>
          <Bars pairs={[[42], [55], [48], [70], [62], [88]]} />
        </div>
      );
    case 'transactions':
      return (
        <div className="divide-y divide-border">
          <Row left="Salary" sub="Main Checking" right="+$4,200.00" tone="in" />
          <Row left="Rent" sub="Housing, Main Checking" right="-$1,650.00" />
          <Row left="Weekly shop" sub="Groceries, Visa Credit Card" right="-$86.40" />
          <Row left="Bus pass" sub="Transport, Main Checking" right="-$42.00" />
        </div>
      );
    case 'budgets':
      return (
        <div className="space-y-5">
          <Meter label="Housing" amount="$1,650 of $1,800" pct={92} />
          <Meter label="Groceries" amount="$320 of $500" pct={64} />
          <Meter label="Dining Out" amount="$95 of $250" pct={38} />
          <Meter label="Transport" amount="$318 of $300" pct={106} over />
        </div>
      );
    case 'wallets':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label="Main Checking" value="$4,280" strong />
            <Tile label="Visa Credit Card" value="-$612" />
            <Tile label="Savings" value="$16,450" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border px-4 py-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">Main Checking</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">Savings</span>
            </span>
            <span className="shrink-0 font-semibold tabular">$200.00</span>
          </div>
        </div>
      );
    case 'recurring':
      return (
        <div className="divide-y divide-border">
          <Row left="Rent" sub="Monthly, Main Checking" right="Due tomorrow" tone="over" />
          <Row left="Internet" sub="Monthly, $59.98" right="In 3 days" />
          <Row left="Streaming" sub="Monthly, $15.49" right="In 11 days" />
          <Row left="Gym" sub="Monthly, $32.00" right="Paid" tone="in" />
        </div>
      );
    default:
      return (
        <div className="space-y-4">
          <Bars pairs={[[60, 48], [64, 52], [66, 78], [70, 74], [68, 45], [84, 50]]} />
          <div className="flex gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Income</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />Expenses</span>
          </div>
        </div>
      );
  }
}

/** "What's inside" section: pick an area of the app on the left, see what it does on the right. */
export function AppTour() {
  const [active, setActive] = useState(AREAS[0].id);
  const reduce = useReducedMotion();
  const area = AREAS.find((a) => a.id === active) ?? AREAS[0];
  const AreaIcon = area.icon;

  return (
    <section id="tour" className="px-4 sm:px-6 lg:px-8 py-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <RevealText
              className="font-display font-bold tracking-tight text-4xl sm:text-5xl leading-[1.08]"
              text="Six screens. Each one does one job."
            />
            <Reveal as="p" className="text-muted-foreground leading-relaxed max-w-md">
              Pick a part of the app to see what it is for.
            </Reveal>
          </div>

          <div
            role="tablist"
            aria-label="Parts of the app"
            className="flex snap-x scroll-px-4 gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 [mask-image:linear-gradient(90deg,transparent,black_1rem,black_calc(100%-3rem),transparent)] lg:mx-0 lg:px-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:[mask-image:none]"
          >
            {AREAS.map((a) => {
              const Icon = a.icon;
              const selected = a.id === active;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  id={`tour-tab-${a.id}`}
                  aria-selected={selected}
                  aria-controls="tour-panel"
                  onClick={(e) => {
                    setActive(a.id);
                    e.currentTarget.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  className={cn(
                    'group relative flex min-h-11 shrink-0 snap-start items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selected ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="tour-active"
                      transition={reduce ? { duration: 0 } : SPRING}
                      className="chrome-green absolute inset-0 rounded-full bg-primary"
                    />
                  )}
                  <Icon className="relative h-4 w-4 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 motion-reduce:transform-none" aria-hidden="true" />
                  <span className="relative whitespace-nowrap">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div
            id="tour-panel"
            role="tabpanel"
            aria-labelledby={`tour-tab-${area.id}`}
            className="chrome-stroke rounded-[1.75rem] border border-border bg-card p-6 sm:p-10 min-h-[520px] shadow-[0_20px_40px_-24px_hsl(150_24%_7%_/_0.25)]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={area.id}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <AreaIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="font-display font-bold tracking-tight text-2xl sm:text-3xl">{area.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-[58ch]">{area.body}</p>
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {area.points.map((p) => (
                      <li key={p} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-border pt-6">
                  <Preview id={area.id} />
                  <p className="mt-5 text-xs text-muted-foreground">Example data</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
