
import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/link';
import {
  ArrowLeftRight,
  BookOpen,
  Keyboard,
  LayoutDashboard,
  Repeat,
  Search,
  Settings,
  Sparkles,
  Target,
  Wallet,
  Wifi,
  WifiOff,
  CloudOff,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { FeedbackHistory } from '@/components/feedback/feedback-history';
import { useTransaction } from '@/context/transaction-context';
import { cn } from '@/lib/utils';

const GUIDES = [
  { href: '/dashboard', icon: LayoutDashboard, title: 'Dashboard', body: 'Your month at a glance: spending, earnings, cash flow and upcoming bills.' },
  { href: '/transactions', icon: ArrowLeftRight, title: 'Transactions', body: 'Search, filter and review every income and expense.' },
  { href: '/wallets', icon: Wallet, title: 'Wallets', body: 'Live balances per account, card or cash, plus transfers between them.' },
  { href: '/recurring', icon: Repeat, title: 'Recurring Bills', body: 'Schedule subscriptions and rent, get reminders, pay in one click.' },
  { href: '/budgets', icon: Target, title: 'Budgets & Goals', body: 'Set monthly limits per category and watch your progress.' },
  { href: '/settings', icon: Settings, title: 'Settings', body: 'Profile, reminders, default wallet, export and data controls.' },
];

const FAQ: { q: string; a: string; tags: string }[] = [
  {
    q: 'How do I add a transaction?',
    a: 'Click "Add Transaction" at the bottom of the sidebar. Choose income or expense, enter the amount, description, category, date and (optionally) the wallet it came from. It appears everywhere instantly.',
    tags: 'add new expense income record',
  },
  {
    q: 'How are wallet balances calculated?',
    a: 'Balance = starting balance + income − expenses recorded against that wallet, plus transfers in and minus transfers out. Transactions without a wallet are not counted in any wallet, but are still included in your income and spending totals.',
    tags: 'wallet balance account calculate',
  },
  {
    q: 'Do transfers count as spending?',
    a: 'No. Moving money between your own wallets changes the two balances but never shows up as income or expense on the dashboard.',
    tags: 'transfer move money wallet',
  },
  {
    q: 'What happens when I pay a recurring bill?',
    a: 'The payment is recorded as an expense dated today (from the bill\'s wallet, if set), and the bill moves to its next due date based on its frequency. One-time bills are marked as Paid instead.',
    tags: 'bill pay recurring subscription due',
  },
  {
    q: 'How do bill reminders work?',
    a: 'The bell in the top bar lists overdue bills and bills due within your reminder window (3 days by default). Change the window or turn reminders off in Settings → Notifications.',
    tags: 'notification bell reminder alert overdue',
  },
  {
    q: 'What is Demo Mode?',
    a: 'Demo Mode loads a tagged set of sample wallets, transactions, transfers and bills so you can explore the app. Turning it off removes only those sample records. Your own data is never touched.',
    tags: 'demo sample example test data',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. Settings → Data lets you download your transactions as CSV (for Excel or Google Sheets) or everything as JSON.',
    tags: 'export download csv backup json',
  },
  {
    q: 'Is my data private?',
    a: 'Your records are stored in your own area of the database. Security rules only allow your signed-in account to read or write them.',
    tags: 'privacy security safe data',
  },
  {
    q: 'Why does it say some data is saved on this device?',
    a: 'The database security rules haven\'t been deployed for those features yet, so they are saved in this browser and keep working. To sync them across devices, the project owner runs "npm run deploy:rules", or pastes firestore.rules into Firebase Console → Firestore → Rules and clicks Publish. Everything saved on the device then uploads automatically.',
    tags: 'error sync blocked permission denied rules',
  },
  {
    q: 'How do I change my name or password?',
    a: 'Go to Settings → Profile. You can update your display name there, or request a password-reset email.',
    tags: 'account profile name password reset',
  },
];

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], mac: ['⌘', 'K'], label: 'Open search' },
  { keys: ['↑', '↓'], label: 'Move through search results' },
  { keys: ['Enter'], label: 'Open the selected result' },
  { keys: ['Esc'], label: 'Close dialogs and menus' },
];

export default function HelpPage() {
  const { localOnly } = useTransaction();
  const [query, setQuery] = useState('');
  const [online, setOnline] = useState(true);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const faq = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.filter((f) => `${f.q} ${f.a} ${f.tags}`.toLowerCase().includes(q));
  }, [query]);

  const status = !online
    ? { icon: WifiOff, tone: 'text-rose-600 bg-rose-500/10', label: 'Offline', body: 'Changes will sync when your connection returns.' }
    : localOnly.length
      ? { icon: CloudOff, tone: 'text-sky-600 bg-sky-500/10', label: 'Working on this device', body: `Saved locally until cloud sync is enabled: ${localOnly.join(', ')}.` }
      : { icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-500/10', label: 'All systems normal', body: 'Connected and syncing in real time.' };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">How can we help?</h1>
        <p className="text-sm text-white/85 mt-1">Search the FAQ, browse guides, or send us a message.</p>
        <div className="relative mt-4 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. transfer, export, reminder"
            className="h-11 pl-10 rounded-xl bg-background text-foreground"
            aria-label="Search help articles"
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" /> Frequently asked questions</CardTitle>
              <CardDescription className="text-xs">
                {query ? `${faq.length} result${faq.length === 1 ? '' : 's'} for "${query}"` : `${FAQ.length} articles`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faq.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No articles match. Try different words, or send us a request below.
                </p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {faq.map((f) => (
                    <AccordionItem key={f.q} value={f.q}>
                      <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {GUIDES.map((g) => (
              <Link key={g.href} href={g.href} className="group rounded-2xl border border-border/50 bg-card p-4 hover:shadow-md hover:border-emerald-500/40 transition-all">
                <g.icon className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-sm font-bold group-hover:text-emerald-600 transition-colors">{g.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.body}</p>
              </Link>
            ))}
          </div>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Contact support</CardTitle>
              <CardDescription className="text-xs">Can&apos;t find an answer? Send a request. It&apos;s saved to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FeedbackForm defaultType="support" types={['support', 'bug']} showRating={false} />
              <div>
                <p className="text-xs font-bold mb-1">Your requests</p>
                <FeedbackHistory only={['support', 'bug']} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">{online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />} System status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', status.tone)}>
                  <status.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">{status.label}</p>
                  <p className="text-xs text-muted-foreground">{status.body}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Keyboard className="w-4 h-4" /> Keyboard shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {SHORTCUTS.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="flex gap-1">
                      {(isMac && s.mac ? s.mac : s.keys).map((k) => (
                        <kbd key={k} className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono font-semibold">{k}</kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-600" /> New here?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Turn on <span className="font-semibold text-foreground">Demo Mode</span> in the sidebar to fill the app with sample data. Turn it off to remove it again.</p>
              <ol className="list-decimal pl-4 space-y-1 text-xs">
                <li>Create a wallet for each account you use.</li>
                <li>Pick a default wallet in Settings.</li>
                <li>Add your recurring bills to get reminders.</li>
                <li>Record transactions as they happen.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
