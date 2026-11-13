import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

const WORD = {
  hidden: { opacity: 0, y: '0.4em', filter: 'blur(6px)' },
  show: { opacity: 1, y: '0em', filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE } },
};

/** Section heading whose words fade and rise in one after another when it scrolls into view. */
export function RevealText({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <h2 className={className}>{text}</h2>;

  const words = text.split(' ');
  return (
    <motion.h2
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
    >
      {words.map((word, i) => (
        <span key={i} aria-hidden="true">
          <motion.span className="inline-block" variants={WORD}>
            {word}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </motion.h2>
  );
}

/** Fades a block up into place when it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0.12,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'p';
}) {
  const reduce = useReducedMotion();
  const Tag = as === 'p' ? motion.p : motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}
