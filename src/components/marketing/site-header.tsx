import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, Moon, Sun, Wallet, X } from 'lucide-react';
import Link from '@/components/link';
import { cn } from '@/lib/utils';

type NavItem = { label: string; href: string; /** Homepage section this link scrolls to. */ section?: string };

export const NAV_ITEMS: NavItem[] = [
  { label: 'Why', href: '/#why', section: 'why' },
  { label: 'Features', href: '/features' },
  { label: 'Tour', href: '/#tour', section: 'tour' },
  { label: 'How it works', href: '/#how', section: 'how' },
  { label: 'Pricing', href: '/#pricing', section: 'pricing' },
  { label: 'FAQ', href: '/#faq', section: 'faq' },
];

const SECTIONS = NAV_ITEMS.flatMap((i) => (i.section ? [i.section] : []));

/** Which homepage section is under the header right now (null above the first one). */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) {
      setActive(null);
      return;
    }
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        const next = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]?.[0] ?? null;
        setActive(next);
      },
      // A band just below the fixed header: a section is "current" while it crosses it.
      { rootMargin: '-96px 0px -55% 0px' },
    );
    // Sections mount lazily; look for them again shortly after the page renders.
    const attach = () => SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    attach();
    const t = window.setTimeout(attach, 800);
    return () => {
      window.clearTimeout(t);
      observer.disconnect();
    };
  }, [enabled]);
  return active;
}

/** Fixed pill header shared by every public page. Collapses to a menu button below 1024px. */
export function SiteHeader({ delay = 0 }: { delay?: number }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onHome = pathname === '/';
  const activeSection = useActiveSection(onHome);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

  // Close the menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes the menu and returns focus to its button; opening focuses the first link.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const isActive = (item: NavItem) => (item.section ? onHome && activeSection === item.section : pathname === item.href);
  const current = (item: NavItem) => (isActive(item) ? (item.section ? 'location' : 'page') : undefined);

  return (
    <motion.header
      initial={reduce ? false : { y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay }}
      className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-4"
    >
      <div className="mx-auto w-full max-w-7xl">
        <nav
          aria-label="Main"
          className="flex items-center justify-between gap-2 rounded-full border border-border bg-card/90 py-2 pl-4 pr-2 shadow-[0_10px_30px_-18px_hsl(150_24%_7%_/_0.4)] backdrop-blur-xl sm:pl-5"
        >
          <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-full pr-2" aria-label="FinTrack home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">FinTrack</span>
          </Link>

          <ul className="hidden items-center gap-1 text-sm lg:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current(item)}
                  className={cn(
                    'relative inline-flex min-h-10 items-center rounded-full px-3.5 transition-colors active:scale-[0.97]',
                    isActive(item) ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>
            <Link
              href="/login"
              className="hidden min-h-10 items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="chrome-green chrome-sheen hidden min-h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all active:translate-y-px min-[380px]:inline-flex"
            >
              Start free
            </Link>
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted lg:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              id={menuId}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="mt-2 max-h-[calc(100dvh-6rem)] origin-top overflow-y-auto rounded-3xl border border-border bg-card p-2 shadow-[0_24px_50px_-20px_hsl(150_24%_7%_/_0.45)] lg:hidden"
            >
              <ul className="grid gap-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current(item)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex min-h-12 items-center rounded-2xl px-4 text-base font-medium transition-colors',
                        isActive(item) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border p-2 pt-3">
                <Link
                  href="/login"
                  className="flex min-h-12 items-center justify-center rounded-full border border-border text-sm font-medium hover:bg-muted"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="chrome-green flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  Start free
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
