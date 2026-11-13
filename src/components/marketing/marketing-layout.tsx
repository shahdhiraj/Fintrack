import type { ReactNode } from 'react';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/**
 * Frame for every public page: skip link, shared header, <main id="main">, shared footer.
 * `overflow-x-clip` stops decorative glows from creating a sideways scroll on phones
 * without breaking position: sticky the way overflow-hidden would.
 */
export function MarketingLayout({ children, headerDelay = 0 }: { children: ReactNode; headerDelay?: number }) {
  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-background font-body text-foreground selection:bg-primary selection:text-primary-foreground">
      <a
        href="#main"
        className="fixed left-3 top-3 z-[80] -translate-y-20 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteHeader delay={headerDelay} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
