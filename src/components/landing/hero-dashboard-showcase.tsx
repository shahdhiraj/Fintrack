import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  DollarSign,
  Gauge,
  HeartPulse,
  HelpCircle,
  Info,
  LayoutGrid,
  Mail,
  MessageSquare,
  Minus,
  Moon,
  MoreHorizontal,
  Plus,
  Repeat,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  Tv,
  Wallet,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useRouter } from '@/lib/navigation';

/* ------------------------------------------------------------------ data */

type TabId = 'dashboard' | 'budgets' | 'transactions';
type Range = '6m' | '12m';
type Icon = typeof LayoutGrid;

type NavItem = { id: TabId | null; label: string; icon: Icon; badge?: string };

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Main menu',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
      { id: 'budgets', label: 'Budgets & Goals', icon: Target, badge: 'Active' },
      { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
      { id: null, label: 'Wallets', icon: Wallet },
      { id: null, label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Features',
    items: [
      { id: null, label: 'Recurring Bills', icon: Repeat },
      { id: null, label: 'Feedback', icon: MessageSquare },
    ],
  },
  {
    title: 'General',
    items: [
      { id: null, label: 'Settings', icon: Settings },
      { id: null, label: 'Help Desk', icon: HelpCircle },
    ],
  },
];
const NAV = NAV_SECTIONS.flatMap((s) => s.items);
const TAB_ORDER: TabId[] = ['dashboard', 'budgets', 'transactions'];

const EARNINGS: Record<Range, { labels: string[]; values: number[] }> = {
  '6m': {
    labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    values: [2800, 3300, 5500, 5500, 5900, 6040],
  },
  '12m': {
    labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    values: [2400, 2600, 2500, 2700, 2900, 2650, 2800, 3300, 5500, 5500, 5900, 6040],
  },
};

const BREAKDOWN_STYLE: Record<string, { bar: string; dot: string }> = {
  Housing: { bar: 'bg-primary', dot: 'bg-primary' },
  Groceries: { bar: 'bg-[hsl(var(--chart-2))]', dot: 'bg-[hsl(var(--chart-2))]' },
  Others: { bar: 'bg-muted-foreground/30', dot: 'bg-muted-foreground/40' },
};

type Budget = { name: string; emoji: string; spent: number; limit: number };

// Mirrors the real Budgets & Goals page.
const INITIAL_BUDGETS: Budget[] = [
  { name: 'Housing', emoji: '🏠', spent: 3300, limit: 1800 },
  { name: 'Utilities', emoji: '⚡', spent: 270.8, limit: 250 },
  { name: 'Shopping', emoji: '🛍️', spent: 249.98, limit: 300 },
  { name: 'Health', emoji: '🩺', spent: 110, limit: 150 },
  { name: 'Groceries', emoji: '🛒', spent: 285, limit: 500 },
  { name: 'Transport', emoji: '🚗', spent: 136.4, limit: 300 },
];
const DEFAULT_LIMITS = Object.fromEntries(INITIAL_BUDGETS.map((b) => [b.name, b.limit]));
// Spending in categories without a budget, so the dashboard total starts at $4,412.16.
const UNBUDGETED_SPEND = 59.98;
const DAYS_LEFT = 19;

// Mirrors the real Transactions page.
type Txn = { id: number; day: number; merchant: string; category: string; wallet: string; amount: number; tag?: 'Demo' | 'New' };

const CATEGORY_EMOJI: Record<string, string> = {
  Salary: '💰',
  Freelance: '💻',
  Groceries: '🛒',
  Housing: '🏠',
  Utilities: '⚡',
  Transport: '🚗',
  Health: '🩺',
  Shopping: '🛍️',
};
const WALLETS = ['Main Checking', 'Visa Credit Card', 'Savings'];

const INITIAL_TXNS: Txn[] = [
  { id: 1, day: 11, merchant: 'Monthly Tech Salary', category: 'Salary', wallet: 'Main Checking', amount: 5200, tag: 'Demo' },
  { id: 2, day: 10, merchant: 'Whole Foods Organic Groceries', category: 'Groceries', wallet: 'Visa Credit Card', amount: -142.5, tag: 'Demo' },
  { id: 3, day: 9, merchant: 'Modern Apartment Rent', category: 'Housing', wallet: 'Main Checking', amount: -1650, tag: 'Demo' },
  { id: 4, day: 8, merchant: 'Freelance UI/UX Design Client', category: 'Freelance', wallet: 'Main Checking', amount: 1400, tag: 'Demo' },
  { id: 5, day: 7, merchant: 'Electric & Water Utility', category: 'Utilities', wallet: 'Main Checking', amount: -92.1, tag: 'Demo' },
  { id: 6, day: 6, merchant: 'City Rideshare', category: 'Transport', wallet: 'Visa Credit Card', amount: -18.4, tag: 'Demo' },
  { id: 7, day: 5, merchant: 'Neighborhood Pharmacy', category: 'Health', wallet: 'Visa Credit Card', amount: -24.5, tag: 'Demo' },
  { id: 8, day: 4, merchant: 'Weekend Sneaker Drop', category: 'Shopping', wallet: 'Savings', amount: -89.99, tag: 'Demo' },
];
const SALARY_TXN_ID = 1;

const QUICK_ADDS: Omit<Txn, 'id' | 'day'>[] = [
  { merchant: 'Farmers Market Haul', category: 'Groceries', wallet: 'Visa Credit Card', amount: -38.9 },
  { merchant: 'Monthly Metro Pass', category: 'Transport', wallet: 'Main Checking', amount: -33 },
  { merchant: 'Vitamins & Supplements', category: 'Health', wallet: 'Visa Credit Card', amount: -24.5 },
  { merchant: 'Desk Lamp', category: 'Shopping', wallet: 'Savings', amount: -59 },
];
const TODAY = 12;

type Bill = { id: number; name: string; amount: number; due: string; note: string; overdue?: boolean; category: string; icon: Icon };

const INITIAL_BILLS: Bill[] = [
  { id: 101, name: 'Car Insurance', amount: 96, due: 'Nov 10, 2026', note: '2 days overdue', overdue: true, category: 'Transport', icon: Car },
  { id: 102, name: 'Netflix Subscription', amount: 15.99, due: 'Nov 15, 2026', note: 'in 3 days', category: 'Shopping', icon: Tv },
  { id: 103, name: 'Internet', amount: 60, due: 'Nov 20, 2026', note: 'in 8 days', category: 'Utilities', icon: Wifi },
];
const EXTRA_BILLS: Omit<Bill, 'id'>[] = [
  { name: 'Gym membership', amount: 35, due: 'Nov 24, 2026', note: 'in 12 days', category: 'Health', icon: HeartPulse },
  { name: 'Phone plan', amount: 45, due: 'Nov 28, 2026', note: 'in 16 days', category: 'Utilities', icon: Zap },
];

type CashMode = 'Income' | 'Expense' | 'Savings';
const CASH_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const CASH_INCOME = EARNINGS['6m'].values;
const CASH_EXPENSE_PAST = [2100, 2600, 3900, 3700, 2250];
const CASH_2025 = { income: [2400, 2500, 2600, 2700, 2650, 2900], expense: [1900, 2100, 2300, 2000, 2200, 2400] };

// Last month's breakdown, for the Spending Overview period switch and its % change.
const LAST_MONTH = { Housing: 1650, Groceries: 310, Others: 290 };
const LAST_MONTH_TOTAL = 2250;
const MONTH_BEFORE_TOTAL = 3700;
const INITIAL_TOTAL = 4412.16;
const AVG_DAYS = INITIAL_TOTAL / 160.07;
const BUDGET_FILTERS = ['All', 'Exceeded', 'Near limit', 'On track'] as const;
type BudgetFilter = (typeof BUDGET_FILTERS)[number];
const MONTHS = ['September 2026', 'October 2026', 'November 2026', 'December 2026'];

/* --------------------------------------------------------------- helpers */

const money = (v: number, decimals = 2) =>
  `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

const EASE = [0.22, 1, 0.36, 1] as const;
const TAP = { scale: 0.94 };

/** Number that eases to its new value whenever it changes. */
function AnimatedMoney({ value, decimals = 2, className }: { value: number; decimals?: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => money(v, decimals));
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.7, ease: EASE });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}

/** Catmull-Rom spline through the points, as an SVG path. */
function smoothPath(pts: [number, number][]) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${
      p2[1] - (p3[1] - p1[1]) / 6
    } ${p2[0]},${p2[1]}`;
  }
  return d;
}

type Tone = 'over' | 'close' | 'ok';

function budgetStatus(b: Budget): { text: string; tone: Tone; label: Exclude<BudgetFilter, 'All'> } {
  const pct = b.spent / b.limit;
  if (pct > 1) return { text: `${money(b.spent - b.limit)} over budget`, tone: 'over', label: 'Exceeded' };
  if (pct >= 0.8) return { text: pct === 1 ? 'Fully used' : `${money(b.limit - b.spent)} left`, tone: 'close', label: 'Near limit' };
  return { text: `${money(b.limit - b.spent)} left`, tone: 'ok', label: 'On track' };
}

const toneText: Record<Tone, string> = {
  over: 'text-destructive',
  close: 'text-[hsl(var(--chart-4))]',
  ok: 'text-muted-foreground',
};
const toneBadge: Record<Tone, string> = {
  over: 'border-destructive/25 bg-destructive/10 text-destructive',
  close: 'border-[hsl(var(--chart-4)/0.35)] bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))]',
  ok: 'border-primary/20 bg-primary/10 text-primary',
};
const toneBar: Record<Tone, string> = {
  over: 'bg-destructive',
  close: 'bg-[hsl(var(--chart-4))]',
  ok: 'bg-primary',
};

const cardClass = 'demo-card-in rounded-2xl border border-border bg-card p-4 sm:p-5';
const liftHover = { y: -3, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } };
const liftShadow = 'transition-shadow hover:shadow-[0_14px_30px_-20px_hsl(150_24%_7%_/_0.45)]';

type Highlight = { key: string | number; nonce: number } | null;

/* ---------------------------------------------------------------- pieces */

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground lg:inline-flex">
      <CalendarDays className="h-3.5 w-3.5 text-primary" />
      <span className="font-medium text-foreground">
        {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
      <span className="h-3 w-px bg-border" />
      <span className="tabular-nums">{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>
    </span>
  );
}

/** Muted tab strip with a sliding white pill, like the app's filter tabs. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
  id,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  id: string;
}) {
  return (
    <div className="inline-flex max-w-full flex-wrap rounded-xl bg-muted p-1 text-xs font-medium">
      {options.map((o) => (
        <motion.button
          key={o.value}
          type="button"
          whileTap={TAP}
          onClick={() => onChange(o.value)}
          className={cn(
            'relative rounded-lg px-3 py-1.5 transition-colors',
            value === o.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`${id}-pill`}
              className="absolute inset-0 rounded-lg bg-card shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

/** Small select menu, styled like the app's pill dropdowns ("Last 6 Months", "This Month"). */
function Dropdown<T extends string>({
  value,
  options,
  onChange,
  variant = 'pill',
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  variant?: 'pill' | 'field';
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} className={cn('relative', variant === 'field' && 'w-full')}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          'flex items-center justify-between gap-2 border border-border bg-card text-xs font-medium transition-colors hover:border-primary/40',
          variant === 'pill' ? 'rounded-full px-3 py-1.5' : 'w-full rounded-xl px-3 py-2.5',
          open && 'border-primary/50'
        )}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-40 mt-1.5 min-w-full origin-top-right rounded-xl border border-border bg-card p-1 shadow-[0_18px_40px_-18px_hsl(150_24%_7%_/_0.45)]"
          >
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted',
                    o.value === value ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {o.label}
                  {o.value === value && <Check className="h-3 w-3 text-primary" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex" tabIndex={0} aria-label={text}>
      <Info className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover/tip:text-foreground" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-52 -translate-x-1/2 translate-y-1 rounded-lg bg-foreground px-2.5 py-2 text-[11px] font-normal leading-snug text-background opacity-0 shadow-lg transition-all duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus/tip:translate-y-0 group-focus/tip:opacity-100">
        {text}
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------- chart */

const W = 600;
const H = 200;
const PAD_TOP = 22;
const PAD_BOTTOM = 8;

function EarningChart({ range }: { range: Range }) {
  const { labels, values } = EARNINGS[range];
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const { line, area, points } = useMemo(() => {
    const max = Math.max(...values) * 1.1;
    const y = (v: number) => H - PAD_BOTTOM - (v / max) * (H - PAD_TOP - PAD_BOTTOM);
    const pts = values.map((v, i) => [(i / (values.length - 1)) * W, y(v)] as [number, number]);
    const l = smoothPath(pts);
    return { line: l, area: `${l} L${W},${H} L0,${H} Z`, points: pts };
  }, [values]);

  const active = hover ?? values.length - 1;
  const leftPct = (points[active][0] / W) * 100;
  const topPct = (points[active][1] / H) * 100;
  const prev = active > 0 ? values[active - 1] : null;
  const change = prev ? ((values[active] - prev) / prev) * 100 : null;

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHover(Math.round(x * (values.length - 1)));
  };

  return (
    <div>
      <div
        ref={boxRef}
        className="relative h-[150px] w-full cursor-crosshair touch-none select-none sm:h-[180px]"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Monthly earnings, ${labels[0]} to ${labels[labels.length - 1]}.`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="heroEarnFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            key={`area-${range}`}
            d={area}
            fill="url(#heroEarnFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          />
          <motion.path
            key={`line-${range}`}
            d={line}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        </svg>

        {/* Month dots, hover guide and tooltip are HTML so they keep their shape. */}
        {points.map(([x, y], i) => (
          <span
            key={`${range}-${i}`}
            className={cn(
              'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary transition-all duration-200',
              i === active ? 'h-3.5 w-3.5 shadow-[0_0_0_5px_hsl(var(--primary)/0.18)]' : 'h-2 w-2'
            )}
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
          />
        ))}
        <div className="pointer-events-none absolute inset-y-0 w-px bg-foreground/10 transition-[left] duration-150" style={{ left: `${leftPct}%` }} />
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-lg transition-[left,top] duration-150"
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            transform: `translate(${leftPct > 75 ? '-100%' : leftPct < 25 ? '0%' : '-50%'}, calc(-100% - 12px))`,
          }}
        >
          <p className="whitespace-nowrap text-[10px] text-muted-foreground">{labels[active]} earnings</p>
          <p className="tabular-nums whitespace-nowrap text-sm font-semibold">
            {money(values[active], 0)}
            {change !== null && (
              <span className={cn('ml-1.5 text-[10px] font-semibold', change >= 0 ? 'text-primary' : 'text-destructive')}>
                {change >= 0 ? '+' : ''}
                {change.toFixed(0)}%
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        {labels.map((l, i) => (
          <span
            key={l}
            className={cn('transition-colors', i === active && 'font-semibold text-foreground', range === '12m' && i % 2 === 1 && 'hidden sm:inline')}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- dashboard tab */

function CashFlowCard({ novExpense }: { novExpense: number }) {
  const [mode, setMode] = useState<CashMode>('Income');
  const [year, setYear] = useState<'2026' | '2025'>('2026');
  const [hover, setHover] = useState<number | null>(null);
  const income = year === '2026' ? CASH_INCOME : CASH_2025.income;
  const expense = year === '2026' ? [...CASH_EXPENSE_PAST, novExpense] : CASH_2025.expense;
  const series: Record<CashMode, number[]> = {
    Income: income,
    Expense: expense,
    Savings: income.map((v, i) => Math.max(v - expense[i], 0)),
  };
  const values = series[mode];
  const max = Math.max(...series.Income);
  const total = values.reduce((s, v) => s + v, 0);
  const active = hover ?? values.length - 1;

  return (
    <div className={cn(cardClass, 'lg:col-span-3')}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          Cash Flow
          <InfoTip text="Money in and out each month. Switch between income, expenses and what you kept." />
        </p>
        <Dropdown
          label="Cash flow year"
          value={year}
          onChange={setYear}
          options={[
            { value: '2026', label: '2026' },
            { value: '2025', label: '2025' },
          ]}
        />
      </div>
      <AnimatedMoney value={total} className="tabular-nums mt-3 block text-2xl font-semibold sm:text-[1.75rem]" />
      <div className="mt-3 flex gap-1.5">
        {(['Income', 'Expense', 'Savings'] as CashMode[]).map((m) => (
          <motion.button
            key={m}
            type="button"
            whileTap={TAP}
            onClick={() => setMode(m)}
            className={cn(
              'relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              mode === m ? 'text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {mode === m && (
              <motion.span layoutId="hero-cash-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">{m}</span>
          </motion.button>
        ))}
      </div>
      <div className="mt-5 flex h-[120px] items-end gap-2 sm:gap-3" onPointerLeave={() => setHover(null)}>
        {values.map((v, i) => (
          <div key={CASH_MONTHS[i]} className="relative flex h-full flex-1 flex-col justify-end" onPointerEnter={() => setHover(i)}>
            <AnimatePresence>
              {i === active && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="tabular-nums pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold shadow"
                >
                  {money(v, 0)}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              className={cn(
                'w-full rounded-t-lg transition-colors',
                mode === 'Expense' ? 'bg-[hsl(var(--chart-4))]' : 'bg-primary',
                i === active ? 'opacity-100' : 'opacity-45'
              )}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((v / max) * 100, 3)}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 22, delay: i * 0.03 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-center text-[11px] text-muted-foreground sm:gap-3">
        {CASH_MONTHS.map((m, i) => (
          <span key={m} className={cn('flex-1 transition-colors', i === active && 'font-semibold text-foreground')}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function BillsCard({ bills, onPay, onAdd }: { bills: Bill[]; onPay: (b: Bill) => void; onAdd: () => void }) {
  const [paying, setPaying] = useState<number | null>(null);
  const pay = (b: Bill) => {
    if (paying) return;
    setPaying(b.id);
    window.setTimeout(() => {
      onPay(b);
      setPaying(null);
    }, 650);
  };
  return (
    <div className={cn(cardClass, 'flex flex-col lg:col-span-2')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Upcoming Bill &amp; Payment</p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          whileHover={{ rotate: 90 }}
          onClick={onAdd}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Add a bill"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>
      <ul className="mt-3 flex-1 space-y-2">
        <AnimatePresence initial={false} mode="popLayout">
          {bills.slice(0, 3).map((b) => {
            const done = paying === b.id;
            return (
              <motion.li
                layout
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.22 } }}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-2.5 transition-colors duration-300',
                  done ? 'border-primary/40 bg-accent' : 'border-border bg-background'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                    b.overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                  )}
                >
                  {b.name[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{b.name}</p>
                  <p className={cn('truncate text-[11px]', b.overdue ? 'text-destructive' : 'text-muted-foreground')}>
                    {b.due} · {b.note}
                  </p>
                </div>
                <span className="tabular-nums shrink-0 text-xs font-semibold">{money(b.amount)}</span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => pay(b)}
                  disabled={paying !== null}
                  className={cn(
                    'flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold transition-colors',
                    done ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40 hover:text-primary'
                  )}
                >
                  <motion.span animate={done ? { scale: [1, 1.5, 1], rotate: [0, -15, 0] } : { scale: 1 }} transition={{ duration: 0.4 }} className="flex">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </motion.span>
                  {done ? 'Paid' : 'Pay'}
                </motion.button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {bills.length === 0 && (
          <motion.li initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-1.5 py-8 text-center text-xs text-muted-foreground">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            All caught up. No bills due.
          </motion.li>
        )}
      </ul>
      {bills.length > 3 && <p className="mt-2 text-center text-[11px] text-muted-foreground">+{bills.length - 3} more this month</p>}
    </div>
  );
}

function DashboardTab({
  range,
  setRange,
  budgets,
  goTo,
  bills,
  onPayBill,
  onAddBill,
}: {
  range: Range;
  setRange: (r: Range) => void;
  budgets: Budget[];
  goTo: (tab: TabId, key?: string | number) => void;
  bills: Bill[];
  onPayBill: (b: Bill) => void;
  onAddBill: () => void;
}) {
  const [focus, setFocus] = useState<string | null>(null);
  const [period, setPeriod] = useState<'this' | 'last'>('this');
  const { values } = EARNINGS[range];
  const earned = values.reduce((s, v) => s + v, 0);
  const growth = ((values[values.length - 1] - values[0]) / values[0]) * 100;

  // Spending follows the live budgets, so adding or deleting a transaction moves these numbers.
  const spentBy = (name: string) => budgets.find((b) => b.name === name)?.spent ?? 0;
  const others =
    budgets.filter((b) => b.name !== 'Housing' && b.name !== 'Groceries').reduce((s, b) => s + b.spent, 0) + UNBUDGETED_SPEND;
  const thisMonth = [
    { name: 'Housing', amount: spentBy('Housing') },
    { name: 'Groceries', amount: spentBy('Groceries') },
    { name: 'Others', amount: others },
  ];
  const total = thisMonth.reduce((s, b) => s + b.amount, 0);
  const breakdown =
    period === 'this' ? thisMonth : (Object.entries(LAST_MONTH) as [string, number][]).map(([name, amount]) => ({ name, amount }));
  const periodTotal = period === 'this' ? total : LAST_MONTH_TOTAL;
  const periodChange =
    period === 'this'
      ? ((total - LAST_MONTH_TOTAL) / LAST_MONTH_TOTAL) * 100
      : ((LAST_MONTH_TOTAL - MONTH_BEFORE_TOTAL) / MONTH_BEFORE_TOTAL) * 100;
  const top = [...budgets].sort((a, b) => b.spent - a.spent)[0];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <motion.button
          type="button"
          whileHover={liftHover}
          whileTap={{ scale: 0.98 }}
          onClick={() => goTo('transactions')}
          className={cn(cardClass, liftShadow, 'group/card text-left')}
        >
          <div className="flex items-start justify-between text-xs font-medium text-muted-foreground">
            Total Spending (This Month)
            <TrendingDown className="h-4 w-4" />
          </div>
          <AnimatedMoney value={total} className="tabular-nums mt-2 block text-xl font-semibold sm:text-2xl" />
          <span className="mt-1 block text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover/card:opacity-100">
            See transactions →
          </span>
        </motion.button>
        <motion.button
          type="button"
          whileHover={liftHover}
          whileTap={{ scale: 0.98 }}
          onClick={() => goTo('budgets', top.name)}
          className={cn(cardClass, liftShadow, 'group/card text-left')}
        >
          <div className="flex items-start justify-between text-xs font-medium text-muted-foreground">
            Highest Spending Category
            <Zap className="h-4 w-4" />
          </div>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg" aria-hidden="true">
              {top.emoji}
            </span>
            <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">{top.name}</span>
            <span className="tabular-nums text-[11px] font-medium text-primary">({money(top.spent)})</span>
          </p>
          <span className="mt-1 block text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover/card:opacity-100">
            Open budget →
          </span>
        </motion.button>
        <motion.div whileHover={liftHover} className={cn(cardClass, liftShadow)}>
          <div className="flex items-start justify-between text-xs font-medium text-muted-foreground">
            Avg. Daily Spend (Last 30 Days)
            <CalendarDays className="h-4 w-4" />
          </div>
          <AnimatedMoney value={total / AVG_DAYS} className="tabular-nums mt-2 block text-xl font-semibold sm:text-2xl" />
        </motion.div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className={cn(cardClass, 'lg:col-span-3')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              Earning Overview
              <InfoTip text="Everything you earned, month by month. Hover or drag across the chart for each month." />
            </p>
            <Dropdown
              label="Earning period"
              value={range}
              onChange={setRange}
              options={[
                { value: '6m', label: 'Last 6 Months' },
                { value: '12m', label: 'Last 12 Months' },
              ]}
            />
          </div>
          <div className="mb-3 mt-3 flex items-center gap-2.5">
            <AnimatedMoney value={earned} className="tabular-nums text-2xl font-semibold sm:text-[1.75rem]" />
            <motion.span
              key={range}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className="inline-flex items-center gap-0.5 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
            >
              +{growth.toFixed(1)}%
              <ArrowUpRight className="h-3 w-3" />
            </motion.span>
          </div>
          <EarningChart range={range} />
        </div>

        <div className={cn(cardClass, 'flex flex-col lg:col-span-2')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              Spending Overview
              <InfoTip text="Total spent and where it went, compared with the month before." />
            </p>
            <Dropdown
              label="Spending period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'this', label: 'This Month' },
                { value: 'last', label: 'Last Month' },
              ]}
            />
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <AnimatedMoney value={periodTotal} className="tabular-nums text-2xl font-semibold sm:text-[1.75rem]" />
            <motion.span
              key={period}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                periodChange > 0 ? 'border-destructive/20 bg-destructive/10 text-destructive' : 'border-primary/20 bg-primary/10 text-primary'
              )}
            >
              {periodChange > 0 ? '+' : ''}
              {periodChange.toFixed(1)}%
              {periodChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </motion.span>
          </div>
          <div className="mt-auto pt-6">
            <p className="mb-3 text-xs font-semibold">Spending Breakdown</p>
            <div className="grid grid-cols-3 gap-2">
              {breakdown.map((b) => (
                <motion.button
                  key={b.name}
                  type="button"
                  whileTap={TAP}
                  onMouseEnter={() => setFocus(b.name)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(b.name)}
                  onBlur={() => setFocus(null)}
                  onClick={() => (b.name === 'Others' ? goTo('budgets') : goTo('budgets', b.name))}
                  className={cn(
                    'rounded-lg p-1.5 text-left transition-[opacity,background-color] hover:bg-muted',
                    focus && focus !== b.name ? 'opacity-40' : 'opacity-100'
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className={cn('h-2 w-2 rounded-full transition-transform', BREAKDOWN_STYLE[b.name].dot, focus === b.name && 'scale-150')} />
                    {b.name}
                  </span>
                  <AnimatedMoney value={b.amount} className="tabular-nums mt-0.5 block text-xs font-semibold" />
                  <span className="text-[10px] text-muted-foreground">{Math.round((b.amount / periodTotal) * 100)}%</span>
                </motion.button>
              ))}
            </div>
            <div className="mt-3 flex h-3 w-full gap-1 rounded-full bg-muted p-0.5">
              {breakdown.map((b, i) => (
                <motion.span
                  key={b.name}
                  onMouseEnter={() => setFocus(b.name)}
                  onMouseLeave={() => setFocus(null)}
                  className={cn('h-full rounded-full transition-opacity', BREAKDOWN_STYLE[b.name].bar, focus && focus !== b.name && 'opacity-30')}
                  initial={{ width: 0 }}
                  animate={{ width: `${(b.amount / periodTotal) * 100}%`, scaleY: focus === b.name ? 1.35 : 1 }}
                  transition={{ duration: 0.7, delay: 0.08 * i, ease: EASE }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <CashFlowCard novExpense={total} />
        <BillsCard bills={bills} onPay={onPayBill} onAdd={onAddBill} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------- budgets tab */

function BudgetCard({
  b,
  lit,
  onSetLimit,
}: {
  b: Budget;
  lit: boolean;
  onSetLimit: (name: string, limit: number) => void;
}) {
  const s = budgetStatus(b);
  const pct = Math.round((b.spent / b.limit) * 100);
  const [draft, setDraft] = useState(String(b.limit));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(String(b.limit));
  }, [b.limit, focused]);
  const edited = b.limit !== DEFAULT_LIMITS[b.name];

  const step = (delta: number) => onSetLimit(b.name, Math.max(25, b.limit + delta));

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={lit ? { opacity: 1, y: 0, scale: [1, 1.03, 1] } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={liftHover}
      transition={{ duration: lit ? 0.6 : 0.25 }}
      className={cn(
        'flex flex-col rounded-2xl border bg-card p-4 transition-[border-color,box-shadow] duration-500',
        lit ? 'border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]' : 'border-border hover:shadow-[0_14px_30px_-20px_hsl(150_24%_7%_/_0.45)]'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2">
          <motion.span whileHover={{ scale: 1.25, rotate: -10 }} className="text-lg" aria-hidden="true">
            {b.emoji}
          </motion.span>
          <span className="truncate font-display text-base font-bold tracking-tight">{b.name}</span>
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={s.label}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', toneBadge[s.tone])}
          >
            {s.label}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn('h-full rounded-full transition-colors duration-500', toneBar[s.tone])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(b.spent / b.limit, 1) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Spent <AnimatedMoney value={b.spent} className="tabular-nums font-semibold text-foreground" />
        </span>
        <span className={cn('tabular-nums font-medium transition-colors', s.tone === 'over' ? 'text-destructive' : 'text-muted-foreground')}>{pct}%</span>
      </div>
      <p className={cn('mt-1.5 text-xs font-medium transition-colors', toneText[s.tone])}>{s.text}</p>

      <div className="mt-3 border-t border-border pt-3">
        <label className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <span className="shrink-0">Limit ($)</span>
          <span className="group/limit flex h-9 min-w-0 flex-1 items-center rounded-full border border-border bg-background pr-1 transition-[border-color,box-shadow] hover:border-primary/40 focus-within:border-primary focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]">
            <input
              inputMode="decimal"
              value={draft}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                setDraft(String(b.limit));
              }}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '');
                setDraft(v);
                const n = parseFloat(v);
                if (n > 0) onSetLimit(b.name, n);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  step(25);
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  step(-25);
                }
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              aria-label={`${b.name} monthly limit in dollars`}
              className="w-full min-w-0 bg-transparent pl-4 text-sm font-semibold tabular-nums text-foreground outline-none"
            />
            <span className="flex shrink-0 items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover/limit:opacity-100 sm:group-focus-within/limit:opacity-100">
              <motion.button
                type="button"
                whileTap={{ scale: 0.8 }}
                onClick={() => step(-25)}
                disabled={b.limit <= 25}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                aria-label={`Lower ${b.name} limit by $25`}
              >
                <Minus className="h-3 w-3" />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.8 }}
                onClick={() => step(25)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Raise ${b.name} limit by $25`}
              >
                <Plus className="h-3 w-3" />
              </motion.button>
            </span>
          </span>
        </label>
        <div className="mt-2 flex h-4 items-center justify-between text-[11px] text-muted-foreground">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={edited ? 'edited' : 'default'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              {edited ? <span className="font-medium text-primary">Custom limit</span> : 'Default limit'}
            </motion.span>
          </AnimatePresence>
          {edited && (
            <button type="button" onClick={() => onSetLimit(b.name, DEFAULT_LIMITS[b.name])} className="font-medium hover:text-foreground hover:underline">
              Reset
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function BudgetsTab({
  budgets,
  onSetLimit,
  highlight,
}: {
  budgets: Budget[];
  onSetLimit: (name: string, limit: number) => void;
  highlight: Highlight;
}) {
  const [filter, setFilter] = useState<BudgetFilter>('All');
  const [month, setMonth] = useState(2);
  const [dir, setDir] = useState(1);
  useEffect(() => {
    if (highlight) setFilter('All');
  }, [highlight]);

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const remaining = totalLimit - totalSpent;
  const counts = BUDGET_FILTERS.reduce(
    (acc, f) => ({ ...acc, [f]: f === 'All' ? budgets.length : budgets.filter((b) => budgetStatus(b).label === f).length }),
    {} as Record<BudgetFilter, number>
  );
  const rows = filter === 'All' ? budgets : budgets.filter((b) => budgetStatus(b).label === filter);
  const onPace = counts.Exceeded === 0;

  const shiftMonth = (d: number) => {
    setDir(d);
    setMonth((m) => Math.min(Math.max(m + d, 0), MONTHS.length - 1));
  };

  const summary = [
    {
      label: 'Total budget',
      value: <AnimatedMoney value={totalLimit} />,
      hint: `${budgets.length} categories`,
      icon: Target,
      tile: 'bg-primary/10 text-primary',
    },
    {
      label: 'Spent',
      value: <AnimatedMoney value={totalSpent} />,
      hint: `${Math.round((totalSpent / totalLimit) * 100)}% of budget`,
      icon: TrendingDown,
      tile: 'bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))]',
    },
    {
      label: remaining >= 0 ? 'Remaining' : 'Over plan',
      value: <AnimatedMoney value={Math.abs(remaining)} />,
      hint: remaining >= 0 ? `${money(remaining / DAYS_LEFT)}/day for ${DAYS_LEFT} days` : 'Raise a limit or cut back',
      icon: DollarSign,
      tile: remaining >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
    },
    {
      label: 'Standing',
      value: <span className={onPace ? '' : 'text-destructive'}>{onPace ? 'On pace' : 'Needs attention'}</span>,
      hint: `${counts.Exceeded} over · ${counts['Near limit']} near limit`,
      icon: Gauge,
      tile: onPace ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-bold tracking-tight sm:text-2xl">Budgets &amp; Goals</p>
          <p className="text-xs text-muted-foreground">Monthly limits per category. A limit stays in place until you change it.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            whileTap={TAP}
            onClick={() => shiftMonth(-1)}
            disabled={month === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <span className="relative w-32 overflow-hidden text-center text-sm font-semibold">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.span
                key={month}
                custom={dir}
                initial={{ x: dir * 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: dir * -24, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="block"
              >
                {MONTHS[month]}
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.button
            type="button"
            whileTap={TAP}
            onClick={() => shiftMonth(1)}
            disabled={month === MONTHS.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary.map(({ label, value, hint, icon: SIcon, tile }) => (
          <motion.div key={label} whileHover={liftHover} className={cn('rounded-2xl border border-border bg-card p-3.5', liftShadow)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                <p className="tabular-nums mt-1 truncate text-base font-semibold sm:text-lg">{value}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{hint}</p>
              </div>
              <motion.span whileHover={{ rotate: 12, scale: 1.1 }} className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', tile)}>
                <SIcon className="h-4 w-4" />
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      <Segmented id="hero-bfilter" value={filter} onChange={setFilter} options={BUDGET_FILTERS.map((f) => ({ value: f, label: `${f} (${counts[f]})` }))} />

      <ul className="grid min-h-[260px] grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((b) => (
            <BudgetCard key={b.name} b={b} lit={highlight?.key === b.name} onSetLimit={onSetLimit} />
          ))}
        </AnimatePresence>
        {rows.length === 0 && (
          <motion.li
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground"
          >
            <CheckCircle2 className="h-6 w-6 text-primary" />
            Nothing here. Nice work.
          </motion.li>
        )}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------- transactions tab */

type SortKey = 'date' | 'amount';

function TransactionsTab({
  txns,
  onDelete,
  onDuplicate,
  onAdd,
  highlight,
  searchNonce,
}: {
  txns: Txn[];
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onAdd: () => void;
  highlight: Highlight;
  searchNonce: number;
}) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [category, setCategory] = useState('all');
  const [wallet, setWallet] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'date', dir: -1 });
  const [menu, setMenu] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const clearFilters = () => {
    setQuery('');
    setType('all');
    setCategory('all');
    setWallet('all');
  };
  useEffect(() => {
    if (highlight) clearFilters();
  }, [highlight]);
  useEffect(() => {
    if (searchNonce) searchRef.current?.focus();
  }, [searchNonce]);
  useEffect(() => {
    if (menu === null) return;
    const onDown = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(null);
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menu]);

  const categories = Array.from(new Set(txns.map((t) => t.category))).sort();
  const q = query.trim().toLowerCase();
  const rows = txns
    .filter(
      (t) =>
        (type === 'all' || (type === 'income' ? t.amount > 0 : t.amount < 0)) &&
        (category === 'all' || t.category === category) &&
        (wallet === 'all' || t.wallet === wallet) &&
        (!q || t.merchant.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    )
    .sort((a, b) => (sort.key === 'date' ? a.day - b.day || a.id - b.id : a.amount - b.amount) * sort.dir);
  const income = rows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = rows.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
  const filtered = q || type !== 'all' || category !== 'all' || wallet !== 'all';

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: -1 }));
  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key !== k ? (
      <ArrowUpDown className="h-3 w-3 opacity-50" />
    ) : (
      <motion.span key={sort.dir} initial={{ y: sort.dir === -1 ? -4 : 4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex">
        {sort.dir === -1 ? <ArrowDown className="h-3 w-3 text-primary" /> : <ArrowUp className="h-3 w-3 text-primary" />}
      </motion.span>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-bold tracking-tight sm:text-2xl">Transactions</p>
          <p className="text-xs text-muted-foreground">
            <motion.span key={txns.length} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-semibold text-foreground">
              {txns.length}
            </motion.span>{' '}
            recorded. Search, filter, edit or delete any of them.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAdd}
          className="group inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.8)] hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
          Add Transaction
        </motion.button>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="space-y-3 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.6fr_1fr_1fr] lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <label className="group relative sm:col-span-3 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search descriptions..."
                aria-label="Search demo transactions"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-8 text-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </label>
            <Dropdown
              variant="field"
              label="Transaction type"
              value={type}
              onChange={setType}
              options={[
                { value: 'all', label: 'All types' },
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' },
              ]}
            />
            <Dropdown
              variant="field"
              label="Category"
              value={category}
              onChange={setCategory}
              options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
            <Dropdown
              variant="field"
              label="Wallet"
              value={wallet}
              onChange={setWallet}
              options={[{ value: 'all', label: 'All wallets' }, ...WALLETS.map((w) => ({ value: w, label: w }))]}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Income', value: income, cls: 'text-primary' },
              { label: 'Expenses', value: expenses, cls: 'text-foreground' },
              { label: 'Net', value: income - expenses, cls: income - expenses >= 0 ? 'text-foreground' : 'text-destructive' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/60 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className={cn('text-xs font-bold tabular-nums sm:text-sm', s.cls)}>
                  {s.label === 'Net' && s.value < 0 ? '−' : ''}
                  <AnimatedMoney value={Math.abs(s.value)} />
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex items-center gap-3 border-y border-border px-3 py-2.5 text-[11px] font-semibold text-muted-foreground sm:px-4">
          <button type="button" onClick={() => toggleSort('date')} className="hidden w-24 shrink-0 items-center gap-1 hover:text-foreground sm:flex">
            Date <SortIcon k="date" />
          </button>
          <span className="min-w-0 flex-1">Description</span>
          <span className="hidden w-28 shrink-0 md:block">Category</span>
          <span className="hidden w-32 shrink-0 lg:block">Wallet</span>
          <button type="button" onClick={() => toggleSort('amount')} className="flex w-24 shrink-0 items-center justify-end gap-1 hover:text-foreground">
            Amount <SortIcon k="amount" />
          </button>
          <span className="w-7 shrink-0" />
        </div>
        <ul className="relative">
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map((t) => {
              const isIncome = t.amount > 0;
              const lit = highlight?.key === t.id;
              return (
                <motion.li
                  layout
                  key={t.id}
                  initial={{ opacity: 0, y: -10, backgroundColor: 'hsl(var(--accent))' }}
                  animate={{ opacity: 1, y: 0, backgroundColor: lit ? 'hsl(var(--accent))' : 'hsl(var(--card) / 0)' }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.6 }}
                  className={cn(
                    'group/row relative flex items-center gap-3 border-b border-border px-3 py-3 text-xs transition-colors last:border-b-0 hover:bg-muted/50 sm:px-4',
                    menu === t.id && 'z-20'
                  )}
                >
                  <span className="hidden w-24 shrink-0 text-muted-foreground sm:block">Nov {t.day}, 2026</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <motion.span whileHover={{ scale: 1.3, rotate: -10 }} className="shrink-0 text-sm" aria-hidden="true">
                      {CATEGORY_EMOJI[t.category] ?? '💳'}
                    </motion.span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{t.merchant}</span>
                      <span className="block truncate text-[10px] text-muted-foreground sm:hidden">
                        Nov {t.day} · {t.category}
                      </span>
                    </span>
                    {t.tag && (
                      <span
                        className={cn(
                          'hidden shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold sm:inline',
                          t.tag === 'New' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                        )}
                      >
                        {t.tag}
                      </span>
                    )}
                  </span>
                  <span className="hidden w-28 shrink-0 md:block">
                    <button
                      type="button"
                      onClick={() => setCategory(t.category)}
                      className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium transition-colors hover:border-primary/40 hover:bg-accent"
                      title={`Show only ${t.category}`}
                    >
                      {t.category}
                    </button>
                  </span>
                  <span className="hidden w-32 shrink-0 truncate text-muted-foreground lg:block">{t.wallet}</span>
                  <span className={cn('w-24 shrink-0 text-right font-semibold tabular-nums', isIncome ? 'text-primary' : 'text-foreground')}>
                    {isIncome ? '+' : '−'}
                    {money(t.amount)}
                  </span>
                  <div ref={menu === t.id ? menuRef : undefined} className="relative w-7 shrink-0">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setMenu((m) => (m === t.id ? null : t.id))}
                      aria-label={`Actions for ${t.merchant}`}
                      aria-expanded={menu === t.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </motion.button>
                    <AnimatePresence>
                      {menu === t.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, x: 6 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: 6 }}
                          transition={{ duration: 0.14 }}
                          className="absolute right-full top-1/2 z-30 mr-1 w-36 -translate-y-1/2 origin-right rounded-xl border border-border bg-card p-1 shadow-[0_18px_40px_-18px_hsl(150_24%_7%_/_0.45)]"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setMenu(null);
                              onDuplicate(t.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-muted"
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenu(null);
                              onDelete(t.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {rows.length === 0 && (
            <li className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Search className="h-5 w-5" />
              No transactions match.
              {filtered && (
                <button type="button" onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">
                  Clear filters
                </button>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- notifications */

type Notice = {
  id: string;
  title: string;
  body: string;
  tone: 'warn' | 'ok';
  tab: TabId;
  target: string | number;
  fix?: boolean;
  donor?: string;
};

type Toast = {
  id: number;
  title: string;
  body?: string;
  tone: 'ok' | 'warn' | 'info';
  action?: { label: string; run: () => void };
};

function ToneIcon({ tone }: { tone: 'ok' | 'warn' | 'info' }) {
  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
        tone === 'warn' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      )}
    >
      {tone === 'warn' ? <AlertTriangle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
    </span>
  );
}

/** Smallest $25 step that covers the overspend, and the budget with the most room to give it. */
function coverPlan(list: Budget[], name: string) {
  const target = list.find((b) => b.name === name);
  if (!target || target.spent <= target.limit) return null;
  const amount = Math.ceil((target.spent - target.limit) / 25) * 25;
  const donor = list
    .filter((b) => b.name !== name && b.limit - b.spent >= amount)
    .sort((a, b) => b.limit - b.spent - (a.limit - a.spent))[0];
  return { amount, donor };
}

/* -------------------------------------------------------------- showcase */

const AUTO_ADVANCE_MS = 6000;
const TOAST_MS = 4500;

/** Placeholder shown for a moment while the demo "loads". Same shape as the dashboard tab. */
function BootSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading the demo dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="demo-shimmer h-24 rounded-2xl" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="demo-shimmer h-64 rounded-2xl lg:col-span-3" />
        <div className="demo-shimmer h-64 rounded-2xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="demo-shimmer h-40 rounded-2xl lg:col-span-3" />
        <div className="demo-shimmer h-40 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}

export function HeroDashboardShowcase() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { amount: 0.35 });

  const [tab, setTab] = useState<TabId>('dashboard');
  // Short "loading" pass when the page opens: skeleton first, then the real cards cascade in.
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    if (reduce) {
      setBooted(true);
      return;
    }
    const id = window.setTimeout(() => setBooted(true), 2600);
    return () => window.clearTimeout(id);
  }, [reduce]);
  const [range, setRange] = useState<Range>('6m');
  const [budgets, setBudgets] = useState(INITIAL_BUDGETS);
  const [txns, setTxns] = useState(INITIAL_TXNS);
  const [bills, setBills] = useState(INITIAL_BILLS);
  const extraBillIndex = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [highlight, setHighlight] = useState<Highlight>(null);
  const [searchNonce, setSearchNonce] = useState(0);
  const [demoOn, setDemoOn] = useState(true);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  // The tour auto-advances until the visitor touches anything.
  const [touched, setTouched] = useState(false);
  const autoplay = !touched && !reduce && inView;

  const budgetsRef = useRef(budgets);
  budgetsRef.current = budgets;
  const txnsRef = useRef(txns);
  txnsRef.current = txns;
  const toastSeq = useRef(0);
  const quickAddIndex = useRef(0);
  const introShown = useRef(false);

  /* toasts */
  const dismissToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const pushToast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++toastSeq.current;
      setToasts((p) => [...p.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismissToast(id), TOAST_MS);
    },
    [dismissToast]
  );

  /* navigation */
  const choose = useCallback((t: TabId) => {
    setTouched(true);
    setTab(t);
  }, []);
  const goTo = useCallback(
    (t: TabId, key?: string | number) => {
      choose(t);
      if (key !== undefined) setHighlight({ key, nonce: Date.now() });
    },
    [choose]
  );
  useEffect(() => {
    if (!highlight) return;
    const id = window.setTimeout(() => setHighlight(null), 2200);
    return () => window.clearTimeout(id);
  }, [highlight]);

  /* budget actions */
  const fixOver = useCallback(
    (name: string) => {
      const plan = coverPlan(budgetsRef.current, name);
      if (!plan) return;
      const { amount, donor } = plan;
      setBudgets((prev) =>
        prev.map((b) =>
          b.name === name ? { ...b, limit: b.limit + amount } : donor && b.name === donor.name ? { ...b, limit: b.limit - amount } : b
        )
      );
      setReadIds((r) => [...r, `over-${name}`]);
      pushToast({
        tone: 'ok',
        title: `${name} is back on track`,
        body: donor ? `Moved ${money(amount, 0)} from ${donor.name}.` : `Raised the limit by ${money(amount, 0)}.`,
      });
      goTo('budgets', name);
    },
    [goTo, pushToast]
  );

  const setLimit = useCallback(
    (name: string, limit: number) => {
      const before = budgetsRef.current.find((b) => b.name === name);
      if (!before || before.limit === limit) return;
      const after = { ...before, limit };
      setBudgets((prev) => prev.map((b) => (b.name === name ? { ...b, limit } : b)));
      const was = budgetStatus(before).tone;
      const now = budgetStatus(after).tone;
      if (was === 'over' && now !== 'over') pushToast({ tone: 'ok', title: `${name} is back on track`, body: `New limit ${money(limit, 0)}.` });
      if (was !== 'over' && now === 'over')
        pushToast({ tone: 'warn', title: `${name} is now over budget`, body: `Spent ${money(after.spent, 0)} of ${money(limit, 0)}.` });
    },
    [pushToast]
  );

  /* transaction actions */
  const changeSpent = (category: string, delta: number) =>
    setBudgets((prev) => prev.map((b) => (b.name === category ? { ...b, spent: Math.max(0, +(b.spent + delta).toFixed(2)) } : b)));

  const addTransaction = () => {
    const next = QUICK_ADDS[quickAddIndex.current % QUICK_ADDS.length];
    quickAddIndex.current += 1;
    const id = Date.now();
    setTxns((prev) => [{ ...next, id, day: TODAY, tag: 'New' }, ...prev]);
    changeSpent(next.category, Math.abs(next.amount));
    choose('transactions');
    pushToast({
      tone: 'info',
      title: `Added ${next.merchant}`,
      body: `−${money(next.amount)} · ${next.category}`,
      action: {
        label: 'Undo',
        run: () => {
          setTxns((prev) => prev.filter((t) => t.id !== id));
          changeSpent(next.category, -Math.abs(next.amount));
        },
      },
    });
  };

  const deleteTxn = (id: number) => {
    const list = txnsRef.current;
    const index = list.findIndex((t) => t.id === id);
    const txn = list[index];
    if (!txn) return;
    setTxns((prev) => prev.filter((t) => t.id !== id));
    if (txn.amount < 0) changeSpent(txn.category, txn.amount);
    pushToast({
      tone: 'info',
      title: `Deleted ${txn.merchant}`,
      body: `${txn.amount > 0 ? '+' : '−'}${money(txn.amount)}`,
      action: {
        label: 'Undo',
        run: () => {
          setTxns((prev) => {
            const copy = prev.filter((t) => t.id !== id);
            copy.splice(Math.min(index, copy.length), 0, txn);
            return copy;
          });
          if (txn.amount < 0) changeSpent(txn.category, -txn.amount);
        },
      },
    });
  };

  const duplicateTxn = (id: number) => {
    const txn = txnsRef.current.find((t) => t.id === id);
    if (!txn) return;
    const copyId = Date.now();
    setTxns((prev) => [{ ...txn, id: copyId, day: TODAY, tag: 'New' }, ...prev]);
    if (txn.amount < 0) changeSpent(txn.category, -txn.amount);
    setHighlight({ key: copyId, nonce: copyId });
    pushToast({
      tone: 'info',
      title: `Duplicated ${txn.merchant}`,
      body: `Dated today, Nov ${TODAY}.`,
      action: {
        label: 'Undo',
        run: () => {
          setTxns((prev) => prev.filter((t) => t.id !== copyId));
          if (txn.amount < 0) changeSpent(txn.category, txn.amount);
        },
      },
    });
  };

  /* sidebar extras */
  const openInApp = (label: string) =>
    pushToast({
      tone: 'info',
      title: `${label} lives in the full app`,
      body: 'Create a free account to open it with your own data.',
      action: { label: 'Start free', run: () => router.push('/signup') },
    });

  const toggleDemo = () => {
    if (demoOn) {
      setDemoOn(false);
      pushToast({
        tone: 'info',
        title: 'Demo mode off',
        body: 'With an account, this is where your own money shows up.',
        action: { label: 'Start free', run: () => router.push('/signup') },
      });
    } else {
      setDemoOn(true);
      setBudgets(INITIAL_BUDGETS);
      setTxns(INITIAL_TXNS);
      setBills(INITIAL_BILLS);
      setReadIds([]);
      pushToast({ tone: 'ok', title: 'Demo data restored', body: 'Everything is back to how it started.' });
    }
  };

  /* bills */
  const payBill = (bill: Bill) => {
    const index = bills.findIndex((b) => b.id === bill.id);
    const txnId = Date.now();
    setBills((prev) => prev.filter((b) => b.id !== bill.id));
    setTxns((prev) => [
      { id: txnId, day: TODAY, merchant: bill.name, category: bill.category, wallet: 'Main Checking', amount: -bill.amount, tag: 'New' },
      ...prev,
    ]);
    changeSpent(bill.category, bill.amount);
    pushToast({
      tone: 'ok',
      title: `Paid ${bill.name}`,
      body: `−${money(bill.amount)} · logged under ${bill.category}`,
      action: {
        label: 'Undo',
        run: () => {
          setBills((prev) => {
            const copy = prev.filter((b) => b.id !== bill.id);
            copy.splice(Math.min(Math.max(index, 0), copy.length), 0, bill);
            return copy;
          });
          setTxns((prev) => prev.filter((t) => t.id !== txnId));
          changeSpent(bill.category, -bill.amount);
        },
      },
    });
  };

  const addBill = () => {
    const next = EXTRA_BILLS[extraBillIndex.current % EXTRA_BILLS.length];
    extraBillIndex.current += 1;
    setBills((prev) => [...prev, { ...next, id: Date.now() }]);
    pushToast({ tone: 'info', title: `Reminder set for ${next.name}`, body: `${money(next.amount)} due ${next.due}.` });
  };

  /* notifications follow the live budgets */
  const notices = useMemo<Notice[]>(() => {
    const over = budgets
      .filter((b) => b.spent > b.limit)
      .map((b) => {
        const plan = coverPlan(budgets, b.name)!;
        return {
          id: `over-${b.name}`,
          title: `${b.name} is ${money(b.spent - b.limit, 0)} over`,
          body: plan.donor ? `Move ${money(plan.amount, 0)} from ${plan.donor.name} to cover it.` : `Raise the limit by ${money(plan.amount, 0)} to cover it.`,
          tone: 'warn' as const,
          tab: 'budgets' as const,
          target: b.name,
          fix: true,
          donor: plan.donor?.name,
        };
      });
    const groceries = budgets.find((b) => b.name === 'Groceries');
    const extra: Notice[] = [{ id: 'salary', title: 'Salary landed', body: '+$5,200.00 added to Main Checking.', tone: 'ok', tab: 'transactions', target: SALARY_TXN_ID }];
    if (groceries && groceries.spent <= groceries.limit)
      extra.unshift({
        id: 'groceries',
        title: 'Groceries on track',
        body: `${money(groceries.spent, 0)} of ${money(groceries.limit, 0)} used, ${DAYS_LEFT} days left.`,
        tone: 'ok',
        tab: 'budgets',
        target: 'Groceries',
      });
    return [...over, ...extra];
  }, [budgets]);
  const unread = notices.filter((n) => !readIds.includes(n.id)).length;

  // First insight pops in shortly after the dashboard comes into view.
  useEffect(() => {
    if (!inView || introShown.current) return;
    introShown.current = true;
    const id = window.setTimeout(() => {
      const first = notices.find((n) => n.fix && n.donor) ?? notices.find((n) => n.fix);
      if (!first) return;
      pushToast({ tone: 'warn', title: first.title, body: first.body, action: { label: 'Fix it', run: () => fixOver(String(first.target)) } });
    }, 2200);
    return () => window.clearTimeout(id);
  }, [inView, notices, pushToast, fixOver]);

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBellOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [bellOpen]);

  /* autoplay tour */
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => {
      setTab((t) => TAB_ORDER[(TAB_ORDER.indexOf(t) + 1) % TAB_ORDER.length]);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [autoplay, tab]);

  // Lies back in perspective and stands up as it scrolls into place.
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start end', 'start 0.25'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  const onFramePointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  };

  const addButton = (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={addTransaction}
      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.8)] transition-colors hover:bg-primary/90"
    >
      <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
      Add Transaction
    </motion.button>
  );

  return (
    <div ref={wrapRef} data-demo-frame className="relative mx-auto max-w-6xl" onPointerDownCapture={() => setTouched(true)}>
      {/* Highlight glow behind the frame */}
      <div className="pointer-events-none absolute -inset-x-8 bottom-0 top-16 rounded-[48px] bg-primary/25 blur-3xl dark:bg-primary/20" aria-hidden="true" />

      <motion.div
        style={{
          rotateX: reduce ? 0 : rotateX,
          scale: reduce ? 1 : scale,
          transformPerspective: 1400,
          transformOrigin: 'center top',
        }}
        className="relative z-20"
      >
        <div
          ref={frameRef}
          onPointerMove={onFramePointer}
          className="group/frame relative rounded-[28px] border border-border bg-card/80 p-2 shadow-[0_50px_100px_-40px_hsl(150_24%_7%_/_0.55)] backdrop-blur-xl"
        >
          {/* Cursor spotlight */}
          <div
            className="pointer-events-none absolute inset-0 z-10 rounded-[28px] opacity-0 transition-opacity duration-300 group-hover/frame:opacity-100"
            style={{ background: 'radial-gradient(520px circle at var(--spot-x, 50%) var(--spot-y, 0%), hsl(var(--primary) / 0.10), transparent 45%)' }}
            aria-hidden="true"
          />

          <div className="relative flex overflow-hidden rounded-[22px] border border-border bg-background">
            {/* Sidebar (tablet and up), mirrors the real app */}
            <nav className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex" aria-label="Demo sections">
              <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
                <motion.span whileHover={{ rotate: -8, scale: 1.08 }} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="h-4 w-4" />
                </motion.span>
                <span className="font-display text-lg font-bold tracking-tight">FinTrack</span>
              </div>
              <div className="border-b border-border px-3 pb-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    goTo('transactions');
                    setSearchNonce(Date.now());
                  }}
                  className="group/search flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Search className="h-3.5 w-3.5 transition-transform group-hover/search:scale-110" />
                  <span className="flex-1 text-left">Search</span>
                  <kbd className="rounded border border-border bg-card px-1.5 text-[10px] font-medium">⌘ K</kbd>
                </motion.button>
              </div>

              <div className="flex-1 space-y-4 p-3">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title} className="space-y-0.5">
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</p>
                    {section.items.map(({ id, label, icon: NIcon, badge }) => {
                      const isActive = id !== null && tab === id;
                      return (
                        <motion.button
                          key={label}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => (id ? choose(id) : openInApp(label))}
                          aria-pressed={id ? isActive : undefined}
                          className={cn(
                            'group/nav relative flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                            isActive ? 'text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="hero-tab-bg"
                              className="absolute inset-0 rounded-xl border border-primary/20 bg-accent"
                              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                            />
                          )}
                          <NIcon className={cn('relative h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:translate-x-0.5', isActive && 'text-primary')} />
                          <span className="relative flex-1 text-left">{label}</span>
                          {badge && (
                            <span className={cn('relative rounded-full px-1.5 py-0.5 text-[10px] font-semibold', isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                              {badge}
                            </span>
                          )}
                          {isActive && autoplay && (
                            <motion.span
                              key={`progress-${id}`}
                              className="absolute bottom-0 left-3 right-3 h-0.5 origin-left rounded-full bg-primary"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={toggleDemo}
                  role="switch"
                  aria-checked={demoOn}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                    demoOn ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Sparkles className={cn('h-4 w-4 shrink-0 transition-colors', demoOn && 'text-primary')} />
                  <span className="flex-1 text-left">Demo Mode</span>
                  <span className={cn('relative flex h-5 w-9 items-center rounded-full px-0.5 transition-colors', demoOn ? 'bg-primary' : 'bg-muted-foreground/30')}>
                    <motion.span
                      layout
                      transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                      className={cn('h-4 w-4 rounded-full bg-white shadow', demoOn ? 'ml-auto' : 'ml-0')}
                    />
                  </span>
                </motion.button>
              </div>

              <div className="border-t border-border p-3">{addButton}</div>
            </nav>

            <div className="relative min-w-0 flex-1">
              {/* Header, like the app's top bar */}
              <div className="relative z-30 flex items-center gap-3 border-b border-border bg-card/60 px-4 py-3 sm:px-5">
                <p className="mr-auto font-display text-base font-bold tracking-tight sm:text-lg">
                  Welcome back, Mara{' '}
                  <motion.span
                    className="inline-block origin-[70%_70%] cursor-default"
                    whileHover={{ rotate: [0, 18, -8, 18, 0] }}
                    transition={{ duration: 0.8 }}
                    aria-hidden="true"
                  >
                    👋
                  </motion.span>
                </p>
                <LiveClock />

                <motion.button
                  type="button"
                  whileTap={TAP}
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-[hsl(var(--chart-4))] transition-colors hover:border-primary/40"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={isDark ? 'moon' : 'sun'}
                      initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex"
                    >
                      {isDark ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4" />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={TAP}
                  onClick={() => openInApp('Help Desk')}
                  aria-label="Help"
                  className="hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground xl:flex"
                >
                  <HelpCircle className="h-4 w-4" />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={TAP}
                  whileHover={{ y: -1 }}
                  onClick={() => pushToast({ tone: 'ok', title: 'Inbox zero', body: 'No new messages. Enjoy the quiet.' })}
                  aria-label="Messages"
                  className="hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground xl:flex"
                >
                  <Mail className="h-4 w-4" />
                </motion.button>

                <div ref={bellRef} className="relative">
                  <motion.button
                    type="button"
                    whileTap={TAP}
                    onClick={() => setBellOpen((o) => !o)}
                    aria-expanded={bellOpen}
                    aria-label={`Notifications, ${unread} unread`}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <motion.span
                      animate={unread && !reduce ? { rotate: [0, -14, 12, -8, 0] } : { rotate: 0 }}
                      transition={{ duration: 0.7, repeat: unread && !reduce ? Infinity : 0, repeatDelay: 4 }}
                      className="flex"
                    >
                      <Bell className="h-4 w-4" />
                    </motion.span>
                    <AnimatePresence>
                      {unread > 0 && (
                        <motion.span
                          key={unread}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
                        >
                          {unread}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <AnimatePresence>
                    {bellOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-4rem))] origin-top-right rounded-2xl border border-border bg-card p-2 shadow-[0_24px_50px_-20px_hsl(150_24%_7%_/_0.5)]"
                      >
                        <div className="flex items-center justify-between px-2 py-1.5">
                          <p className="text-sm font-semibold">Insights</p>
                          <button
                            type="button"
                            onClick={() => setReadIds(notices.map((n) => n.id))}
                            className="text-[11px] font-medium text-primary hover:underline disabled:opacity-40"
                            disabled={!unread}
                          >
                            Mark all read
                          </button>
                        </div>
                        <ul className="space-y-1">
                          {notices.map((n) => {
                            const isRead = readIds.includes(n.id);
                            return (
                              <motion.li layout key={n.id} className={cn('flex gap-2.5 rounded-xl p-2 transition-colors hover:bg-muted', !isRead && 'bg-accent/40')}>
                                <ToneIcon tone={n.tone} />
                                <div className="min-w-0 flex-1">
                                  <p className="flex items-center gap-1.5 text-xs font-semibold">
                                    {n.title}
                                    {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                  </p>
                                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{n.body}</p>
                                  <div className="mt-1.5 flex gap-3 text-[11px] font-semibold">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReadIds((r) => [...r, n.id]);
                                        setBellOpen(false);
                                        goTo(n.tab, n.target);
                                      }}
                                      className="text-foreground hover:text-primary"
                                    >
                                      View
                                    </button>
                                    {n.fix && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setBellOpen(false);
                                          fixOver(String(n.target));
                                        }}
                                        className="text-primary hover:underline"
                                      >
                                        Fix it
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.li>
                            );
                          })}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <span className="hidden items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground sm:inline-flex lg:hidden">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Live demo
                </span>
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  className="relative hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold ring-2 ring-transparent transition-shadow hover:ring-primary/30 sm:flex"
                  aria-label="Signed in as Mara, live demo"
                  title="Live demo"
                >
                  M
                  <span className="absolute bottom-0 right-0 hidden h-2.5 w-2.5 rounded-full border-2 border-card bg-primary lg:block" />
                </motion.span>
              </div>

              {/* Tab bar (phones) */}
              <div className="flex gap-1 border-b border-border p-2 md:hidden">
                {TAB_ORDER.map((id) => {
                  const item = NAV.find((n) => n.id === id)!;
                  const TIcon = item.icon;
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      whileTap={TAP}
                      onClick={() => choose(id)}
                      aria-pressed={tab === id}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                        tab === id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                      )}
                    >
                      <TIcon className="h-3.5 w-3.5" />
                      {id === 'budgets' ? 'Budgets' : item.label}
                    </motion.button>
                  );
                })}
              </div>

              <div className="relative min-h-[580px] p-3 sm:p-5">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={booted ? tab : 'boot'}
                    initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                    transition={{ duration: 0.28, ease: EASE }}
                  >
                    {!booted && <BootSkeleton />}
                    {booted && tab === 'dashboard' && (
                      <DashboardTab
                        range={range}
                        setRange={(r) => {
                          setTouched(true);
                          setRange(r);
                        }}
                        budgets={budgets}
                        goTo={goTo}
                        bills={bills}
                        onPayBill={payBill}
                        onAddBill={addBill}
                      />
                    )}
                    {booted && tab === 'budgets' && <BudgetsTab budgets={budgets} onSetLimit={setLimit} highlight={highlight} />}
                    {booted && tab === 'transactions' && (
                      <TransactionsTab
                        txns={txns}
                        onDelete={deleteTxn}
                        onDuplicate={duplicateTxn}
                        onAdd={addTransaction}
                        highlight={highlight}
                        searchNonce={searchNonce}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Add button (phones) */}
              <div className="border-t border-border p-3 md:hidden">{addButton}</div>

              {/* Toasts live inside the demo, bottom-right, and never cover the page around it */}
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-40 flex flex-col items-end gap-2 sm:left-auto sm:w-80" aria-live="polite">
                <AnimatePresence initial={false}>
                  {toasts.map((t) => (
                    <motion.div
                      layout
                      key={t.id}
                      initial={{ opacity: 0, y: 16, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="pointer-events-auto relative flex w-full items-start gap-2.5 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-[0_18px_40px_-18px_hsl(150_24%_7%_/_0.5)]"
                    >
                      <ToneIcon tone={t.tone} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{t.title}</p>
                        {t.body && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{t.body}</p>}
                      </div>
                      {t.action && (
                        <motion.button
                          type="button"
                          whileTap={TAP}
                          onClick={() => {
                            t.action!.run();
                            dismissToast(t.id);
                          }}
                          className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          {t.action.label}
                        </motion.button>
                      )}
                      <button
                        type="button"
                        onClick={() => dismissToast(t.id)}
                        className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {!reduce && (
                        <motion.span
                          className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-primary/50"
                          initial={{ scaleX: 1 }}
                          animate={{ scaleX: 0 }}
                          transition={{ duration: TOAST_MS / 1000, ease: 'linear' }}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default HeroDashboardShowcase;
