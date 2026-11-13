import { ArrowLeftRight, LayoutDashboard, Menu, Plus, Target, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from '@/components/link';
import { usePathname } from '@/lib/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';
import { cn } from '@/lib/utils';

type Tab = { href: string; label: string; icon: LucideIcon };

const LEFT: Tab[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Activity', icon: ArrowLeftRight },
];
const RIGHT: Tab[] = [{ href: '/budgets', label: 'Budgets', icon: Target }];
const TAB_PATHS = [...LEFT, ...RIGHT].map((t) => t.href);

/**
 * Bottom navigation for phones (hidden from 768px, where the sidebar is visible).
 * Three destinations, a raised Add button for the most common action, and More,
 * which opens the full menu.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { openMobile, setOpenMobile } = useSidebar();
  const onOtherPage = !TAB_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const tab = ({ href, label, icon: Icon }: Tab) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <li key={href} className="flex-1">
        <Link
          href={href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-colors active:scale-95',
            active ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {active && (
            <motion.span
              layoutId="mobile-tab-active"
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-x-2 inset-y-1 rounded-2xl bg-primary/10"
              aria-hidden="true"
            />
          )}
          <Icon className={cn('relative h-5 w-5', active && 'stroke-[2.5]')} aria-hidden="true" />
          <span className="relative">{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center">
        {LEFT.map(tab)}
        <li className="flex flex-1 justify-center">
          <AddTransactionDialog
            trigger={
              <button
                type="button"
                aria-label="Add transaction"
                className="chrome-green -mt-6 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_12px_24px_-10px_hsl(var(--primary)/0.8)] transition-transform active:scale-90"
              >
                <Plus className="h-6 w-6" aria-hidden="true" />
              </button>
            }
          />
        </li>
        {RIGHT.map(tab)}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => setOpenMobile(!openMobile)}
            aria-expanded={openMobile}
            aria-current={onOtherPage ? 'page' : undefined}
            className={cn(
              'relative flex h-14 w-full flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-colors active:scale-95',
              onOtherPage || openMobile ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {onOtherPage && !openMobile && (
              <motion.span
                layoutId="mobile-tab-active"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-x-2 inset-y-1 rounded-2xl bg-primary/10"
                aria-hidden="true"
              />
            )}
            <Menu className="relative h-5 w-5" aria-hidden="true" />
            <span className="relative">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
