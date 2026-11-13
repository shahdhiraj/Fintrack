import { useEffect, useRef, useState, type ComponentType } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Section = { id: string; label: string; icon: ComponentType<{ className?: string }> };

/** Which settings section is in view: the one crossing a band near the top, or the last at the very bottom. */
function useActiveSection(ids: string[], bottomRef: React.RefObject<HTMLElement>) {
  const [active, setActive] = useState(ids[0]);
  // After a tap, the smooth scroll passes other sections: let the tapped one win until it settles.
  const lockUntil = useRef(0);
  const choose = (id: string) => {
    lockUntil.current = Date.now() + 1200;
    setActive(id);
  };
  useEffect(() => {
    const visible = new Map<string, number>();
    const band = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
        if (top && Date.now() > lockUntil.current) setActive(top);
      },
      { rootMargin: '-96px 0px -55% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) band.observe(el);
    });
    // Short last sections never reach the band: mark them active once the page bottom is visible.
    const bottom = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && Date.now() > lockUntil.current) setActive(ids[ids.length - 1]);
    });
    if (bottomRef.current) bottom.observe(bottomRef.current);
    return () => {
      band.disconnect();
      bottom.disconnect();
    };
  }, [ids, bottomRef]);
  return [active, choose] as const;
}

/**
 * Settings section menu with an active state: a sticky list beside the content on large
 * screens, and a sticky, scrollable row of chips under the header on phones and tablets.
 */
export function SettingsNav({ sections, bottomRef }: { sections: Section[]; bottomRef: React.RefObject<HTMLElement> }) {
  const reduce = useReducedMotion();
  const ids = useRef(sections.map((s) => s.id)).current;
  const [active, setActive] = useActiveSection(ids, bottomRef);
  const chipRow = useRef<HTMLUListElement>(null);

  // Keep the active chip visible in the phone row. Scroll the row itself: scrollIntoView on a
  // chip inside a sticky bar would also scroll the page back to the bar's original position.
  useEffect(() => {
    const row = chipRow.current;
    const chip = row?.querySelector<HTMLElement>(`[data-section="${active}"]`);
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [active, reduce]);

  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 34 };

  const link = (s: Section, variant: 'list' | 'chip') => {
    const isActive = active === s.id;
    const Icon = s.icon;
    return (
      <a
        href={`#${s.id}`}
        data-section={s.id}
        onClick={() => setActive(s.id)}
        aria-current={isActive ? 'location' : undefined}
        className={cn(
          'relative flex items-center gap-2 text-sm font-semibold transition-colors',
          variant === 'list' ? 'min-h-10 rounded-xl px-3' : 'min-h-10 shrink-0 rounded-full px-4',
          isActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        )}
      >
        {isActive && (
          <motion.span
            layoutId={`settings-active-${variant}`}
            transition={spring}
            className={cn(
              'absolute inset-0 border border-emerald-500/20 bg-emerald-500/15 dark:bg-emerald-500/20',
              variant === 'list' ? 'rounded-xl' : 'rounded-full',
            )}
            aria-hidden="true"
          />
        )}
        <Icon className={cn('relative h-4 w-4', isActive && 'text-emerald-600 dark:text-emerald-400')} />
        <span className="relative">{s.label}</span>
      </a>
    );
  };

  return (
    <>
      {/* Phones and tablets */}
      <nav aria-label="Settings sections" className="sticky top-14 z-20 -mx-4 bg-background/90 px-4 py-2 backdrop-blur-md md:top-16 md:-mx-6 md:px-6 lg:hidden">
        <ul ref={chipRow} className="no-scrollbar flex gap-1 overflow-x-auto">
          {sections.map((s) => (
            <li key={s.id}>{link(s, 'chip')}</li>
          ))}
        </ul>
      </nav>

      {/* Large screens */}
      <nav aria-label="Settings sections" className="hidden lg:block">
        <ul className="sticky top-20 space-y-1">
          {sections.map((s) => (
            <li key={s.id}>{link(s, 'list')}</li>
          ))}
        </ul>
      </nav>
    </>
  );
}
