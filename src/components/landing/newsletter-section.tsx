import { useId, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowRight, Check, Loader2, Mail } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { cn } from '@/lib/utils';
import { Reveal, RevealText } from './reveal';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SPRING = { type: 'spring', stiffness: 260, damping: 20 } as const;

type Status = 'idle' | 'sending' | 'done' | 'error';

/**
 * Newsletter signup. Each address is one document at /newsletter/{email}, so signing up
 * twice just overwrites it. Visitors can write that document but never read the list.
 */
export function NewsletterSection() {
  const db = useFirestore();
  const reduce = useReducedMotion();
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) {
      setError('Enter an email address like name@example.com.');
      setStatus('error');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      await setDoc(doc(db, 'newsletter', value), { email: value, createdAt: serverTimestamp(), source: 'landing' });
      setStatus('done');
    } catch (err) {
      if ((err as { code?: string }).code === 'permission-denied' && import.meta.env.DEV) {
        console.warn('Newsletter write denied. Deploy firestore.rules (npm run deploy:rules) to allow /newsletter writes.');
      }
      setError('We could not sign you up just now. Please try again in a moment.');
      setStatus('error');
    }
  };

  const invalid = status === 'error' && error !== '';

  return (
    <section id="newsletter" className="px-4 sm:px-6 lg:px-8 pb-24">
      <div className="chrome-green relative isolate max-w-7xl mx-auto overflow-hidden rounded-[1.75rem] px-6 py-12 sm:px-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Soft light pools and a faint grid so the gradient has depth. */}
        <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-[hsl(148_70%_60%_/_0.35)] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 -z-10 h-80 w-80 rounded-full bg-[hsl(165_84%_8%_/_0.5)] blur-3xl" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_80%_at_70%_40%,black,transparent)]"
          aria-hidden="true"
        />
        <div className="lg:col-span-6 space-y-4">
          <RevealText
            className="font-display font-bold tracking-tight text-3xl sm:text-4xl leading-[1.1] text-white"
            text="One short money tip a month."
          />
          <Reveal as="p" className="text-white/85 leading-relaxed max-w-md">
            Budgeting ideas and new FinTrack features, in one email at the start of each month. Unsubscribe from any email.
          </Reveal>
        </div>

        <div className="lg:col-span-6">
          <AnimatePresence mode="wait" initial={false}>
            {status === 'done' ? (
              <motion.div
                key="done"
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING}
                className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.2)]"
                role="status"
              >
                <motion.span
                  initial={reduce ? false : { scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...SPRING, delay: 0.1 }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary"
                >
                  <Check className="h-5 w-5" aria-hidden="true" />
                </motion.span>
                <div>
                  <p className="font-semibold">You are on the list.</p>
                  <p className="text-sm text-white/80">The next email goes out at the start of the month.</p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={onSubmit}
                noValidate
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                className="flex flex-col gap-2"
              >
                <label htmlFor={inputId} className="text-sm font-medium text-white">
                  Email address
                </label>
                <motion.div
                  animate={invalid && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <div className="group relative flex-1">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(150_8%_42%)] transition-colors group-focus-within:text-primary"
                      aria-hidden="true"
                    />
                    <input
                      id={inputId}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      placeholder="name@example.com"
                      aria-invalid={invalid}
                      aria-describedby={invalid ? errorId : helpId}
                      disabled={status === 'sending'}
                      className={cn(
                        'h-12 w-full rounded-full border bg-white pl-11 pr-4 text-sm text-[hsl(150_24%_9%)] outline-none transition-[border-color,box-shadow] placeholder:text-[hsl(150_8%_42%)]',
                        'focus:border-white focus:shadow-[0_0_0_4px_hsl(0_0%_100%_/_0.35)]',
                        invalid ? 'border-destructive' : 'border-transparent',
                      )}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="chrome-sheen group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[hsl(162_84%_10%)] px-6 text-sm font-semibold text-white shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.18),0_10px_24px_-14px_hsl(165_84%_6%_/_0.8)] transition-[transform,background-color] hover:bg-[hsl(162_84%_7%)] active:scale-[0.98] disabled:opacity-70"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Subscribing
                      </>
                    ) : (
                      <>
                        Subscribe
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </motion.div>
                {invalid ? (
                  <p id={errorId} className="self-start rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-destructive" role="alert">
                    {error}
                  </p>
                ) : (
                  <p id={helpId} className="text-sm text-white/80">
                    We only use your email for this newsletter.
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
