import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

const KEY = 'fintrack-intro-seen';
const EASE = [0.16, 1, 0.3, 1] as const;

/** How long the intro covers the page, in seconds. The hero waits this long before it builds. */
export const INTRO_SECONDS = 1.1;

/** True the first time the homepage opens in this browser tab. */
export function introPending(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === null;
  } catch {
    return false;
  }
}

/**
 * Opening curtain for the homepage: the logo pops in, the name rises letter by letter,
 * a bar fills, then the whole panel slides up to reveal the page. Shown once per tab.
 */
export function PageIntro() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(KEY, '1');
    } catch {
      /* private mode: the intro just plays again next time */
    }
    const id = window.setTimeout(() => setOpen(false), (INTRO_SECONDS - 0.2) * 1000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="intro"
          role="status"
          aria-label="Loading FinTrack"
          exit={{ y: '-100%' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-background"
        >
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="chrome-green flex h-12 w-12 items-center justify-center rounded-xl"
            >
              <Wallet className="h-6 w-6" aria-hidden="true" />
            </motion.span>
            <span className="flex overflow-hidden font-display text-3xl font-bold tracking-tight" aria-hidden="true">
              {'FinTrack'.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.12 + i * 0.035 }}
                  className="inline-block"
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          </div>
          <div className="h-1 w-44 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: INTRO_SECONDS - 0.3, ease: 'easeInOut' }}
              className="chrome-green h-full origin-left rounded-full !border-0"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
