import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  HandCoins,
  LineChart,
  PiggyBank,
  Repeat,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from '@/components/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Magnetic } from '@/components/landing/magnetic';
import { Reveal, RevealText } from '@/components/landing/reveal';
import { cn } from '@/lib/utils';

type Chapter = {
  id: string;
  icon: LucideIcon;
  nav: string;
  title: string;
  intro: string;
  /** One real number from the app, shown as the chapter's highlight. */
  fact: { value: string; label: string };
  points: { title: string; body: string }[];
  where: string;
};

// Every point below maps to something in the app today. Keep it that way when editing.
const CHAPTERS: Chapter[] = [
  {
    id: 'transactions',
    icon: ArrowLeftRight,
    nav: 'Transactions',
    title: 'Record every dollar in and out',
    intro: 'Income and expenses go in with an amount, a date, a category and the wallet they came from.',
    fact: { value: '2', label: 'entry types: income and expense' },
    points: [
      { title: 'Quick add', body: 'Add an entry from the dashboard or the Transactions page without leaving what you were doing.' },
      { title: 'Search and filter', body: 'Find entries by description, then narrow the list by type, category or wallet.' },
      { title: 'Edit or delete', body: 'Fix a typo or a wrong amount at any time. Balances and budgets update straight away.' },
      { title: 'Export to CSV', body: 'Download every entry from Settings, or one month at a time from Reports.' },
    ],
    where: 'Sidebar, Transactions',
  },
  {
    id: 'budgets',
    icon: Target,
    nav: 'Budgets & Goals',
    title: 'A monthly limit for each category',
    intro: 'Decide what each category is worth this month, then watch a bar fill as you spend.',
    fact: { value: '15', label: 'spending categories, each with a starting limit' },
    points: [
      { title: 'Ready-made limits', body: 'Every category starts with a suggested limit, from Housing to Pets, that you can change.' },
      { title: 'Limits carry forward', body: 'A limit you set stays in place in the following months until you change it again.' },
      { title: 'Clear status', body: 'Each category reads On track, Near limit once you pass 80%, or Exceeded.' },
      { title: 'Filter by status', body: 'Show only the categories that are over or close to their limit.' },
    ],
    where: 'Sidebar, Budgets & Goals',
  },
  {
    id: 'goals',
    icon: PiggyBank,
    nav: 'Savings goals',
    title: 'Save towards something specific',
    intro: 'Give a goal a target amount and, if you like, a date. Every time you set money aside, the progress bar moves.',
    fact: { value: '+ / −', label: 'add money to a goal, or take some out, at any time' },
    points: [
      { title: 'Monthly amount needed', body: 'With a target date, FinTrack works out how much to put aside each month to get there.' },
      { title: 'On-track check', body: 'Your saving pace so far is compared with what is needed, so you know early if you are behind.' },
      { title: 'Projected finish', body: 'Without a date, see roughly which month you will reach the target at your current pace.' },
      { title: 'Saving history', body: 'Every amount you added or took out is listed, and can be removed if you made a mistake.' },
    ],
    where: 'Sidebar, Budgets & Goals, Savings goals tab',
  },
  {
    id: 'wallets',
    icon: Wallet,
    nav: 'Wallets',
    title: 'Every account, card and cash pocket',
    intro: 'Add the places your money lives, with an opening balance, and see one total across all of them.',
    fact: { value: '6', label: 'wallet types, from bank account to e-wallet' },
    points: [
      { title: 'Six wallet types', body: 'Bank account, cash, credit card, savings, e-wallet and investment.' },
      { title: 'Transfers', body: 'Move money between wallets. Both balances update, and the transfer is not counted as spending.' },
      { title: 'Running balances', body: 'Each wallet shows its balance from the opening amount plus everything recorded against it.' },
      { title: 'Colour coding', body: 'Give each wallet its own colour so it is easy to spot in lists.' },
    ],
    where: 'Sidebar, Wallets',
  },
  {
    id: 'recurring',
    icon: Repeat,
    nav: 'Recurring Bills',
    title: 'Bills that remind you before they are due',
    intro: 'Rent, subscriptions and utilities live in one list with their next due date.',
    fact: { value: '5', label: 'schedules: one-time, weekly, monthly, quarterly, yearly' },
    points: [
      { title: 'Flexible schedules', body: 'Set a bill once and it rolls on to the next due date on its own schedule.' },
      { title: 'Mark as paid', body: 'Tick a bill off when it leaves your account and it moves to the next period.' },
      { title: 'Reminders in the bell', body: 'Choose how many days ahead a bill appears in the notification bell.' },
      { title: 'Overdue alerts', body: 'Anything past its due date is flagged until you deal with it.' },
    ],
    where: 'Sidebar, Recurring Bills',
  },
  {
    id: 'debts',
    icon: HandCoins,
    nav: 'Debts & loans',
    title: 'What you owe, and what you are owed',
    intro: 'Track a loan you are paying off or money you lent someone, with what is left and when it is due.',
    fact: { value: '2', label: 'directions: money you owe and money owed to you' },
    points: [
      { title: 'Repayments', body: 'Record each payment and watch the remaining balance and payoff bar update.' },
      { title: 'Due dates', body: 'Each debt shows if it is due soon or overdue, and the page counts what is overdue.' },
      { title: 'Net position', body: 'See the total you owe, the total owed to you, and the difference between them.' },
      { title: 'Optional transactions', body: 'A repayment can also be added to your transactions so wallet balances include it.' },
    ],
    where: 'Sidebar, Debts & Loans',
  },
  {
    id: 'reports',
    icon: BarChart3,
    nav: 'Reports',
    title: 'A monthly report that tells you what changed',
    intro: 'Pick any month to see income against expenses, the category breakdown and what to do next.',
    fact: { value: '3', label: 'export formats: PDF, CSV and JSON' },
    points: [
      { title: 'Month at a glance', body: 'Total spending, income, savings rate, top category and average daily spend.' },
      { title: 'Suggestions', body: 'Plain advice based on your limits and last month, worked out on your device.' },
      { title: 'Month-end projection', body: 'For the current month, see where spending is heading at today\'s pace.' },
      { title: 'Export the report', body: 'Save it as a PDF, or download the summary and transactions as CSV or JSON.' },
    ],
    where: 'Sidebar, Reports',
  },
  {
    id: 'trends',
    icon: LineChart,
    nav: 'Trends',
    title: 'See the last six or twelve months',
    intro: 'Income, spending and what you kept, month by month, and which way each category is heading.',
    fact: { value: '12', label: 'months of history in one chart' },
    points: [
      { title: 'Month by month', body: 'Income and spending side by side for each month, with the amount you kept drawn as a line.' },
      { title: 'Averages', body: 'Average monthly spending and income, and your savings rate over the whole period.' },
      { title: 'Best month', body: 'The month you kept the most, and the month you spent the most.' },
      { title: 'Category trends', body: 'Spending per category for each month, and whether the latest month is up or down on its average.' },
    ],
    where: 'Sidebar, Reports, Trends section',
  },
  {
    id: 'extras',
    icon: Sparkles,
    nav: 'Everyday extras',
    title: 'The small things that save time',
    intro: 'Features you notice on day three, not day one.',
    fact: { value: '⌘K', label: 'or Ctrl K opens search from anywhere' },
    points: [
      { title: 'Search everything', body: 'Jump to any page, category or transaction from one search box.' },
      { title: 'Demo mode', body: 'Load a sample dataset to explore, then remove it without touching your own records.' },
      { title: 'Light and dark', body: 'Follows your system setting, or pick one yourself.' },
      { title: 'Backup and delete', body: 'Export everything as JSON from Settings, or delete all your data in one step.' },
    ],
    where: 'Search in the sidebar, the rest in Settings',
  },
];

const FAQS = [
  {
    q: 'Do I need to connect my bank?',
    a: 'No. FinTrack never asks for bank logins or card numbers. You add entries yourself, which keeps sensitive details out of the app.',
  },
  {
    q: 'Are the suggestions made by AI?',
    a: 'They are calculated on your device from your own transactions, limits and last month. Nothing is sent to an AI service.',
  },
  {
    q: 'What happens if syncing fails?',
    a: 'Your entries are kept on this device and uploaded to your account once syncing works again.',
  },
  {
    q: 'Can I take my data with me?',
    a: 'Yes. Export transactions as CSV, a full backup as JSON, or a monthly report as a PDF at any time.',
  },
];

/** Tracks which chapter is under the header, for the chapter menu. */
function useCurrentChapter() {
  const [current, setCurrent] = useState(CHAPTERS[0].id);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setCurrent(hit.target.id);
      },
      { rootMargin: '-120px 0px -60% 0px' },
    );
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return current;
}

export default function FeaturesPage() {
  const reduce = useReducedMotion();
  const current = useCurrentChapter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <MarketingLayout>
      {/* Page hero */}
      <section aria-labelledby="features-title" className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 md:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-accent/60 to-transparent" aria-hidden="true" />
        <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[560px]" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-end gap-12 lg:grid-cols-12">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-primary dark:bg-card">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Features
            </p>
            <h1 id="features-title" className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Everything FinTrack does, <span className="text-chrome">explained.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Nine parts of the app, what each one is for, and exactly what you can do in it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link
                  href="/signup"
                  className="chrome-green chrome-sheen group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
                >
                  Start free
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </Magnetic>
              <a
                href="#transactions"
                className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-card/70 px-7 text-sm font-medium backdrop-blur transition-all hover:border-primary/50 hover:bg-muted active:scale-[0.98]"
              >
                Start reading
                <ArrowDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
              </a>
            </div>
          </motion.div>

          {/* Jump list */}
          <motion.nav
            aria-label="Feature chapters"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="chrome-stroke rounded-[1.75rem] p-3 lg:col-span-5"
          >
            <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {CHAPTERS.map((c) => {
                const Icon = c.icon;
                return (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      className="group flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{c.nav}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.title}</span>
                      </span>
                      <ArrowDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        </div>
      </section>

      {/* Chapters with a sticky chapter menu */}
      <div className="border-t border-border bg-card px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 py-16 lg:grid-cols-12 lg:py-24">
          <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
            <ul className="sticky top-28 space-y-1 border-l border-border">
              {CHAPTERS.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    aria-current={current === c.id ? 'location' : undefined}
                    className={cn(
                      '-ml-px flex min-h-10 items-center border-l-2 pl-4 text-sm transition-colors',
                      current === c.id
                        ? 'border-primary font-semibold text-primary'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                  >
                    {c.nav}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-20 lg:col-span-9 lg:space-y-28">
            {CHAPTERS.map((c, i) => {
              const Icon = c.icon;
              return (
                <section key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-28">
                  <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
                    <div className="space-y-4 xl:col-span-7">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <p className="text-sm font-medium text-primary">{c.nav}</p>
                      <RevealText
                        className="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl"
                        text={c.title}
                      />
                      <Reveal as="p" className="max-w-[56ch] leading-relaxed text-muted-foreground">
                        {c.intro}
                      </Reveal>
                    </div>

                    <Reveal className="xl:col-span-5" delay={0.1}>
                      <div
                        className={cn(
                          'flex h-full flex-col justify-between gap-6 rounded-[1.75rem] p-6 sm:p-8',
                          i % 2 === 0 ? 'chrome-green text-white' : 'chrome-stroke [--chrome-fill:hsl(var(--background))]',
                        )}
                      >
                        <p className="font-display text-5xl font-bold tracking-tight tabular sm:text-6xl">{c.fact.value}</p>
                        <p className={cn('text-sm leading-relaxed', i % 2 === 0 ? 'text-white/85' : 'text-muted-foreground')}>{c.fact.label}</p>
                      </div>
                    </Reveal>
                  </div>

                  <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    {c.points.map((pt, j) => (
                      <motion.li
                        key={pt.title}
                        initial={reduce ? false : { opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20, delay: j * 0.05 }}
                        className="group flex gap-3 border-t border-border pt-5"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="font-semibold">{pt.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pt.body}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>

                  <p className="mt-6 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Where to find it:</span> {c.where}
                  </p>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {/* Questions about features */}
      <section aria-labelledby="features-faq" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-4 lg:col-span-4">
            <RevealText className="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl" text="Questions people ask first" />
            <Reveal as="p" className="leading-relaxed text-muted-foreground">
              More answers about plans and privacy are on the{' '}
              <Link href="/#faq" className="font-medium text-primary underline-offset-4 hover:underline">
                homepage FAQ
              </Link>
              .
            </Reveal>
          </div>
          <div className="divide-y divide-border border-y border-border lg:col-span-8">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`features-faq-${i}`}
                      className="group flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-medium transition-colors hover:text-primary"
                    >
                      <span className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none">{f.q}</span>
                      <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`features-faq-${i}`}
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section aria-labelledby="features-cta" className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="chrome-green relative isolate mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-[1.75rem] px-6 py-12 sm:px-12 md:flex-row md:items-center">
          <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-72 w-72 rounded-full bg-[hsl(148_70%_60%_/_0.35)] blur-3xl" aria-hidden="true" />
          <div className="banner-grid" aria-hidden="true" />
          <div className="max-w-xl space-y-3">
            <h2 id="features-cta" className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Set your first budget in about two minutes.
            </h2>
            <p className="text-white/85">Free to start. No bank login, no card number.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/signup"
              className="chrome-sheen inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[hsl(162_84%_14%)] shadow-[0_10px_24px_-14px_hsl(165_84%_6%_/_0.8)] active:scale-[0.98]"
            >
              Start free
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
