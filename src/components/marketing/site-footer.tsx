import { Wallet } from 'lucide-react';
import Link from '@/components/link';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Why FinTrack', href: '/#why' },
      { label: 'How it works', href: '/#how' },
      { label: 'Pricing', href: '/#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/#about' },
      { label: 'Reviews', href: '/#testimonials' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Start free', href: '/signup' },
      { label: 'Log in', href: '/login' },
    ],
  },
];

const linkClass = 'inline-flex min-h-9 items-center rounded-md text-muted-foreground transition-colors hover:text-foreground';

/** Footer shared by every public page. */
export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-border bg-gradient-to-b from-card via-card to-accent/70 px-4 pb-8 pt-16 sm:px-6 lg:px-8">
      {/* Soft green glow, decorative. */}
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-80 w-[min(56rem,120%)] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 pb-12 md:grid-cols-12">
          <div className="col-span-2 space-y-4 md:col-span-5">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 rounded-full" aria-label="FinTrack home">
              <span className="chrome-green flex h-8 w-8 items-center justify-center rounded-lg">
                <Wallet className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">FinTrack</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Track spending, hold your limits, and keep a calm view of everything your money does.
            </p>
          </div>

          {COLUMNS.map((col, i) => (
            <nav key={col.title} aria-label={col.title} className={i === 2 ? 'md:col-span-3' : 'md:col-span-2'}>
              <h2 className="mb-3 text-sm font-semibold">{col.title}</h2>
              <ul className="space-y-1 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} FinTrack</span>
          <a href="mailto:support@fintrack.app" className={linkClass}>
            Support: support@fintrack.app
          </a>
        </div>
      </div>
    </footer>
  );
}
