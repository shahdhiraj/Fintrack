import { useRef } from 'react';
import { motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Link from '@/components/link';
import { Magnetic } from './magnetic';

const EASE = [0.16, 1, 0.3, 1] as const;

const HEADLINE: { word: string; accent?: boolean }[] = [
  { word: 'Know' },
  { word: 'exactly' },
  { word: 'where' },
  { word: 'your' },
  { word: 'money', accent: true },
  { word: 'goes.', accent: true },
];
const HEADLINE_TEXT = HEADLINE.map((h) => h.word).join(' ');

// Load sequence: label, then the headline word by word, the underline, the paragraph, the buttons.
const FADE_UP = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
};
const HEADLINE_STAGE = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const WORD = {
  hidden: { opacity: 0, y: '0.55em', rotateX: -55, filter: 'blur(12px)' },
  show: { opacity: 1, y: '0em', rotateX: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};
const POP = {
  hidden: { opacity: 0, y: 16, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 220, damping: 18 } },
};

/**
 * Hero copy. It builds itself on load, then drifts back, shrinks and blurs as the page
 * scrolls, so the dashboard below takes over. Everything is static under reduced motion.
 */
export function HeroIntro({ delay = 0.1 }: { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const y = useTransform(progress, [0, 1], [0, 130]);
  const scale = useTransform(progress, [0, 1], [1, 0.92]);
  const opacity = useTransform(progress, [0.15, 0.85], [1, 0]);
  const blur = useTransform(progress, [0.15, 0.85], [0, 10]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  if (reduce) {
    return (
      <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-primary dark:bg-card">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Personal budgeting, made calm
        </p>
        <h1 className="mt-5 font-display font-bold tracking-tight leading-[1.02] text-5xl sm:text-6xl lg:text-7xl text-balance">
          Know exactly where your <span className="text-chrome">money goes.</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
          Budgets, savings goals, bills, debts and reports in one calm app. Set a limit for each category and hear about it before a budget slips.
        </p>
        <Buttons />
      </div>
    );
  }

  return (
    <div ref={ref}>
      <motion.div style={{ y, scale, opacity, filter }} className="will-change-transform">
        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: delay } } }}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto text-center flex flex-col items-center"
        >
          <motion.p
            variants={FADE_UP}
            className="hero-label inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-primary shadow-[0_6px_20px_-12px_hsl(150_24%_7%_/_0.35)] transition-transform hover:-translate-y-0.5 dark:bg-card"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Personal budgeting, made calm
          </motion.p>

          <motion.h1
            variants={HEADLINE_STAGE}
            aria-label={HEADLINE_TEXT}
            className="mt-5 font-display font-bold tracking-tight leading-[1.02] text-5xl sm:text-6xl lg:text-7xl text-balance [perspective:900px]"
          >
            {HEADLINE.map(({ word, accent }, i) => (
              <span key={word} aria-hidden="true">
                <motion.span
                  variants={WORD}
                  className={`relative inline-block origin-bottom pb-[0.08em] ${accent ? 'text-chrome' : ''}`}
                >
                  {word}
                </motion.span>
                {i < HEADLINE.length - 1 ? ' ' : ''}
              </span>
            ))}
          </motion.h1>

          {/* Underline that draws itself once the headline has landed. */}
          <motion.span
            aria-hidden="true"
            className="chrome-green mt-3 block h-1.5 w-40 origin-left rounded-full sm:w-56"
            variants={{
              hidden: { scaleX: 0, opacity: 0 },
              show: { scaleX: 1, opacity: 1, transition: { duration: 0.9, ease: EASE, delay: 0.35 } },
            }}
          />

          <motion.p variants={FADE_UP} className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            Budgets, savings goals, bills, debts and reports in one calm app. Set a limit for each category and hear about it before a budget slips.
          </motion.p>

          <Buttons animated />
        </motion.div>
      </motion.div>
    </div>
  );
}

function Buttons({ animated }: { animated?: boolean }) {
  const primary = (
    <Magnetic>
      <Link
        href="/signup"
        className="group inline-flex items-center gap-2 chrome-green bg-primary text-primary-foreground font-semibold text-sm px-7 py-4 rounded-full chrome-sheen active:scale-[0.98]"
      >
        Start free
        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </Link>
    </Magnetic>
  );
  const secondary = (
    <a
      href="#how"
      className="group inline-flex items-center gap-2 text-sm font-medium text-foreground px-7 py-4 rounded-full border border-border bg-card/70 backdrop-blur hover:bg-muted hover:border-primary/50 active:scale-[0.98] transition-all"
    >
      How it works
      <ArrowDown className="w-4 h-4 text-muted-foreground group-hover:translate-y-0.5 transition-transform" />
    </a>
  );

  if (!animated) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {primary}
        {secondary}
      </div>
    );
  }
  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      className="mt-8 flex flex-wrap items-center justify-center gap-3"
    >
      <motion.div variants={POP}>{primary}</motion.div>
      <motion.div variants={POP}>{secondary}</motion.div>
    </motion.div>
  );
}
