import type { PointerEvent, ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, RevealText } from './reveal';

const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const;

/**
 * A reason card. A soft green light follows the cursor, and hovering switches the
 * card's children from their "rest" variant to "hover", so each demo reacts.
 */
function WhyCard({
  className,
  title,
  body,
  children,
  index,
}: {
  className?: string;
  title: string;
  body: string;
  children: ReactNode;
  index: number;
}) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const light = useMotionTemplate`radial-gradient(280px circle at ${mx}px ${my}px, hsl(var(--primary) / 0.16), transparent 70%)`;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...SPRING, delay: index * 0.07 }}
      className={className}
    >
      <motion.div
        initial="rest"
        animate="rest"
        whileHover={reduce ? undefined : 'hover'}
        whileTap={reduce ? undefined : 'hover'}
        onPointerMove={onMove}
        className="chrome-stroke group relative flex h-full flex-col justify-between gap-10 overflow-hidden rounded-[1.75rem] p-8 sm:p-10 hover:-translate-y-1 motion-reduce:transform-none hover:shadow-[0_24px_50px_-28px_hsl(var(--primary)/0.45)]"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: light }}
        />
        <div className="relative min-h-[120px]">{children}</div>
        <div className="relative space-y-2">
          <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
          <p className="max-w-[48ch] text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* Demos. Sample numbers; each one moves when its card is hovered or pressed. */

function LimitDemo() {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">Groceries</span>
        <span className="relative h-9 w-40 text-right font-display text-3xl font-bold tabular">
          <motion.span className="absolute right-0" variants={{ rest: { opacity: 1, y: 0 }, hover: { opacity: 0, y: -10 } }} transition={SPRING}>
            Nrs. 320
          </motion.span>
          <motion.span className="absolute right-0" variants={{ rest: { opacity: 0, y: 10 }, hover: { opacity: 1, y: 0 } }} transition={SPRING}>
            Nrs. 480
          </motion.span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full origin-left rounded-full bg-primary"
          variants={{ rest: { scaleX: 0.64 }, hover: { scaleX: 0.96 } }}
          transition={SPRING}
        />
      </div>
      <div className="relative h-5 text-sm tabular">
        <motion.p className="absolute text-muted-foreground" variants={{ rest: { opacity: 1 }, hover: { opacity: 0 } }}>
          Nrs. 180 left of Nrs. 500
        </motion.p>
        <motion.p className="absolute font-medium text-primary" variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}>
          Only Nrs. 20 left. Time to slow down.
        </motion.p>
      </div>
    </div>
  );
}

function NoBankDemo() {
  return (
    <div className="flex items-center gap-5">
      <motion.span
        className="chrome-green flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
        variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -10, scale: 1.1 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 12 }}
      >
        <ShieldCheck className="h-7 w-7" aria-hidden="true" />
      </motion.span>
      <ul className="space-y-2 text-sm">
        {['No bank login', 'No card number', 'No account linking'].map((line, i) => (
          <motion.li
            key={line}
            className="font-medium"
            variants={{ rest: { x: 0, opacity: 0.7 }, hover: { x: 6, opacity: 1 } }}
            transition={{ ...SPRING, delay: i * 0.05 }}
          >
            {line}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const WALLETS: [string, string][] = [
  ['Main Checking', 'Nrs. 4,280'],
  ['Savings', 'Nrs. 16,450'],
  ['Cash', 'Nrs. 120'],
];

function TotalDemo() {
  return (
    <div className="space-y-2">
      {WALLETS.map(([name, amount], i) => (
        <motion.div
          key={name}
          className="flex justify-between text-sm"
          variants={{ rest: { x: 0, opacity: 0.75 }, hover: { x: 4, opacity: 1 } }}
          transition={{ ...SPRING, delay: i * 0.05 }}
        >
          <span>{name}</span>
          <span className="tabular text-muted-foreground">{amount}</span>
        </motion.div>
      ))}
      <motion.div
        className="flex origin-right items-baseline justify-between border-t border-border pt-3"
        variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
        transition={SPRING}
      >
        <span className="text-sm font-semibold">Total</span>
        <span className="font-display text-3xl font-bold tabular text-primary">Nrs. 20,850</span>
      </motion.div>
    </div>
  );
}

function DataDemo() {
  const chip = 'flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium';
  return (
    <div className="flex flex-wrap gap-3">
      <motion.span className={chip} variants={{ rest: { y: 0 }, hover: { y: -6 } }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
        <Download className="h-4 w-4 text-primary" aria-hidden="true" />
        Export CSV
      </motion.span>
      <motion.span
        className={chip}
        variants={{ rest: { y: 0 }, hover: { y: -6 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.06 }}
      >
        <Download className="h-4 w-4 text-primary" aria-hidden="true" />
        JSON backup
      </motion.span>
      <motion.span
        className={cn(chip, 'text-destructive')}
        variants={{ rest: { y: 0 }, hover: { y: -6 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.12 }}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete all data
      </motion.span>
    </div>
  );
}

/** "Why FinTrack": four reasons, each with a small demo that reacts to the cursor. */
export function WhySection() {
  return (
    <section id="why" className="px-4 sm:px-6 lg:px-8 py-24">
      <div className="max-w-7xl mx-auto space-y-14">
        <div className="max-w-2xl space-y-4">
          <RevealText
            className="font-display font-bold tracking-tight text-4xl sm:text-5xl leading-[1.08]"
            text="Why budget with FinTrack?"
          />
          <Reveal as="p" className="text-muted-foreground leading-relaxed">
            Four reasons it is easy to keep using. Hover or tap a card to see each one in action.
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <WhyCard
            index={0}
            className="lg:col-span-7"
            title="You find out before you overspend"
            body="Every category has a limit and a bar. You see the room you have left while you can still change course."
          >
            <LimitDemo />
          </WhyCard>
          <WhyCard
            index={1}
            className="lg:col-span-5"
            title="No bank passwords"
            body="FinTrack never connects to your bank. You enter what you spend, so nothing sensitive is handed over."
          >
            <NoBankDemo />
          </WhyCard>
          <WhyCard
            index={2}
            className="lg:col-span-5"
            title="Every account, one total"
            body="Checking, savings, cards and cash add up in one place, so the number you plan with is the real one."
          >
            <TotalDemo />
          </WhyCard>
          <WhyCard
            index={3}
            className="lg:col-span-7"
            title="Your data leaves when you say so"
            body="Export your transactions or a full backup whenever you like, or delete everything from Settings."
          >
            <DataDemo />
          </WhyCard>
        </div>
      </div>
    </section>
  );
}
