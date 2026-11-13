import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Compass, LayoutGrid, Search, Sparkles, Tag } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Link from '@/components/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { useUser } from '@/firebase';

type Dest = { label: string; href: string; body: string; icon: typeof Compass };

const PUBLIC_DESTS: Dest[] = [
  { label: 'Homepage', href: '/', body: 'What FinTrack is and how it works.', icon: Compass },
  { label: 'Features', href: '/features', body: 'Every part of the app, explained.', icon: Sparkles },
  { label: 'Pricing', href: '/#pricing', body: 'Plans, including the free one.', icon: Tag },
];

// Close matches for common typos, so a mistyped address still gets you there.
const KNOWN: { words: string[]; href: string; label: string }[] = [
  { words: ['home', 'index'], href: '/', label: 'the homepage' },
  { words: ['feature', 'features', 'feat'], href: '/features', label: 'Features' },
  { words: ['price', 'pricing', 'plans', 'plan', 'cost'], href: '/#pricing', label: 'Pricing' },
  { words: ['faq', 'help', 'questions', 'support'], href: '/#faq', label: 'FAQ' },
  { words: ['login', 'log-in', 'signin', 'sign-in'], href: '/login', label: 'Log in' },
  { words: ['signup', 'sign-up', 'register', 'join'], href: '/signup', label: 'Create an account' },
  { words: ['dashboard', 'app'], href: '/dashboard', label: 'Dashboard' },
  { words: ['budget', 'budgets', 'goals'], href: '/budgets', label: 'Budgets & Goals' },
  { words: ['report', 'reports'], href: '/reports', label: 'Reports' },
  { words: ['wallet', 'wallets'], href: '/wallets', label: 'Wallets' },
  { words: ['transaction', 'transactions'], href: '/transactions', label: 'Transactions' },
];

function guess(pathname: string) {
  const slug = pathname.toLowerCase().replace(/^\/+|\/+$/g, '').split('/')[0] ?? '';
  if (!slug) return null;
  return KNOWN.find((k) => k.words.some((w) => slug === w || slug.startsWith(w) || w.startsWith(slug))) ?? null;
}

/** Shown for any address that is not a page. Public, so it works signed in or out. */
export default function NotFound() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const reduce = useReducedMotion();
  const match = guess(pathname);
  const [query, setQuery] = useState('');

  const dests: Dest[] = user
    ? [{ label: 'Dashboard', href: '/dashboard', body: 'Back to your month.', icon: LayoutGrid }, ...PUBLIC_DESTS.slice(0, 2)]
    : PUBLIC_DESTS;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const hit = guess(`/${query.trim()}`);
    navigate(hit ? hit.href : '/features');
  };

  return (
    <MarketingLayout>
      <section aria-labelledby="nf-title" className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 md:pt-40 lg:px-8">
        <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[640px]" aria-hidden="true" />
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <p className="font-display text-7xl font-bold tracking-tight text-chrome sm:text-8xl" aria-hidden="true">
            404
          </p>
          <h1 id="nf-title" className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            This page does not exist.
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
            The address{' '}
            <code className="break-all rounded-md bg-muted px-1.5 py-0.5 text-sm text-foreground">{pathname}</code> may be
            mistyped, or the page has moved.
          </p>

          {match && (
            <p className="mt-6">
              <Link
                href={match.href}
                className="chrome-green chrome-sheen group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
              >
                Did you mean {match.label}?
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </p>
          )}

          <form onSubmit={onSearch} className="mx-auto mt-8 flex max-w-md flex-col gap-2 text-left" role="search">
            <label htmlFor="nf-search" className="text-sm font-medium">
              Where were you heading?
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  id="nf-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. pricing, budgets, login"
                  className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold transition-colors hover:border-primary/50 hover:bg-muted active:scale-[0.98]"
              >
                Go
              </button>
            </div>
          </form>
        </motion.div>

        <ul className="relative mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {dests.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.li
                key={d.href}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 20, delay: 0.15 + i * 0.06 }}
              >
                <Link
                  href={d.href}
                  className="chrome-stroke group flex h-full flex-col gap-3 rounded-[1.75rem] p-6 transition-transform hover:-translate-y-1 motion-reduce:transform-none"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-lg font-semibold">{d.label}</span>
                  <span className="text-sm text-muted-foreground">{d.body}</span>
                </Link>
              </motion.li>
            );
          })}
        </ul>

        <p className="relative mt-10 text-center">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go back
          </button>
        </p>
      </section>
    </MarketingLayout>
  );
}
