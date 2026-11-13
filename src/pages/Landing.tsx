
import Link from '@/components/link';
import Image from '@/components/image';
import { HeroDashboardShowcase } from '@/components/landing/hero-dashboard-showcase';
import { HeroIntro } from '@/components/landing/hero-intro';
import { NewsletterSection } from '@/components/landing/newsletter-section';
import { INTRO_SECONDS, PageIntro, introPending } from '@/components/landing/page-intro';
import { AppTour } from '@/components/landing/app-tour';
import { WhySection } from '@/components/landing/why-section';
import { LiveBento } from '@/components/landing/live-sections';
import { Reveal, RevealText } from '@/components/landing/reveal';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import {
  ArrowUpRight,
  ArrowDown,
  Check,
  Cloud,
  HardDrive,
  Download,
  Trash2,
  Send,
  Loader2,
  ChevronDown,
  Bot,
} from "lucide-react";
import { Suspense, lazy, useEffect, useState, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

// Remotion and its player load only when the page needs them.
const MonthFilmPlayer = lazy(() => import('@/components/landing/month-film'));

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

// Radius system: interactive elements are pills, surfaces are 1.75rem, tiles inside a surface are rounded-2xl.
const SURFACE = "rounded-[1.75rem]";

const faqs = [
  {
    question: "How do transactions get into FinTrack?",
    answer:
      "Add income and expenses in a few taps, with amount, date, category and wallet. You can edit or delete any entry later, and search or filter the full list.",
  },
  {
    question: "How do monthly budgets work?",
    answer:
      "Set a spending limit for each category, like groceries or transport. Every transaction counts against that limit, and a progress bar shows how much room is left before month end.",
  },
  {
    question: "What does the budgeting assistant actually do?",
    answer:
      "It reads your past spending and points out where limits look too tight or too loose, flags categories creeping over budget, and suggests amounts you can realistically save.",
  },
  {
    question: "Is my financial data private?",
    answer:
      "Your data is yours. It is stored encrypted, never sold, and you can export or delete everything from Settings whenever you want.",
  },
  {
    question: "Can I track more than one account?",
    answer:
      "Yes. Group checking, savings, and cash in one view so your totals reflect everything, not just one balance.",
  },
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const reduce = useReducedMotion();
  // Opening curtain, once per browser tab. The hero and dashboard wait for it to lift.
  const [intro] = useState(() => !reduce && introPending());
  const lead = intro ? INTRO_SECONDS : 0;

  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Hi, I'm your budgeting assistant. Looking at last month, you spent Nrs. 640 on dining against a Nrs. 500 plan. Ask me anything about your budget.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view by scrolling the chat box only.
  // (scrollIntoView would also scroll the window, jumping the page down on load.)
  useEffect(() => {
    const box = chatScrollRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [chatMessages, isTyping, reduce]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now(), sender: "user", text: inputValue };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const q = userMsg.text.toLowerCase();
      let reply = "";
      if (q.includes("save") || q.includes("budget") || q.includes("spend")) {
        reply =
          "Dining is your loosest category. Drop the limit from Nrs. 640 to Nrs. 500 and you free up Nrs. 140 a month without touching essentials.";
      } else if (q.includes("subscription") || q.includes("recurring")) {
        reply =
          "I found two overlapping streaming charges totalling Nrs. 27 a month. Cancelling one keeps you inside your entertainment limit.";
      } else if (q.includes("account") || q.includes("balance")) {
        reply =
          "Across checking and savings you have Nrs. 20,730 available. Your safe-to-spend for the rest of this month is Nrs. 410.";
      } else {
        reply =
          "At your current pace you'll end the month about Nrs. 180 under budget. Keep that up and it covers a month of groceries by spring.";
      }

      let curLen = 0;
      const botId = Date.now() + 1;
      const typingTimer = setInterval(() => {
        curLen += 3;
        const textChunk = reply.substring(0, curLen);
        setChatMessages((prev) => {
          const rest = prev.filter((m) => m.id !== botId);
          return [...rest, { id: botId, sender: "bot", text: textChunk }];
        });
        if (curLen >= reply.length) {
          clearInterval(typingTimer);
          setIsTyping(false);
        }
      }, 18);
    }, 700);
  };

  return (
    <MarketingLayout headerDelay={lead}>
      {intro && <PageIntro />}

      {/* 2. HERO */}
      <section id="overview" className="relative px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-20 md:pb-24 overflow-hidden">
        <motion.div
          initial={reduce ? false : { opacity: 0, scaleY: 0.6 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 1.2, delay: lead, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 top-0 h-[560px] origin-top bg-gradient-to-b from-accent/60 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        {/* Graph-paper grid: fine lines every 24px, stronger lines every 120px, fading out toward the edges. */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: lead + 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="hero-grid absolute inset-x-0 top-0 h-[900px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto">
          <HeroIntro delay={lead + 0.1} />

          {/* Interactive dashboard showcase */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 70, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: lead + 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 md:mt-16"
          >
            <HeroDashboardShowcase />
          </motion.div>
        </div>
      </section>

      <WhySection />

      <LiveBento />

      <AppTour />

      {/* HOW IT WORKS: Remotion film + assistant */}
      <section id="how" className="px-4 sm:px-6 lg:px-8 py-24 border-t border-border">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="max-w-2xl space-y-4">
            <RevealText
              className="font-display font-bold tracking-tight text-4xl sm:text-5xl leading-[1.08]"
              text="Watch a month in 16 seconds."
            />
            <Reveal as="p" className="text-muted-foreground leading-relaxed">
              Set limits, log spending, get the nudge, review. Then ask the assistant a question about a sample month.
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <Suspense fallback={<div className={`${SURFACE} border border-border bg-card aspect-video animate-pulse`} aria-busy="true" />}>
                <MonthFilmPlayer />
              </Suspense>
            </div>

            {/* Assistant */}
            <div className="lg:col-span-4">
              <div className={`${SURFACE} border border-border bg-card p-5 space-y-4`}>
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-9 h-9 rounded-full chrome-green bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Budgeting assistant</h3>
                    <p className="text-xs text-muted-foreground">Ask about your month</p>
                  </div>
                </div>

                <div ref={chatScrollRef} className="h-[280px] overflow-y-auto space-y-3 pr-1 no-scrollbar" aria-live="polite">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "ml-auto chrome-green bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 bg-muted text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g. How can I save more?"
                    disabled={isTyping}
                    aria-label="Ask the budgeting assistant"
                    className="flex-1 text-sm px-4 py-2.5 rounded-full bg-background border border-border outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    disabled={isTyping}
                    aria-label="Send message"
                    className="w-10 h-10 shrink-0 rounded-full chrome-green bg-primary text-primary-foreground flex items-center justify-center chrome-sheen active:translate-y-px transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {["How can I save more?", "Any wasteful subscriptions?", "What's my balance?"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setInputValue(chip)}
                      className="min-h-10 text-xs px-3.5 py-2 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary hover:-translate-y-0.5 active:scale-[0.96] transition-all motion-reduce:transform-none"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STORY */}
      <section id="about" className="px-4 sm:px-6 lg:px-8 py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <div className={`relative ${SURFACE} overflow-hidden border border-border h-[380px] sm:h-[440px]`}>
              <Image
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&h=660&q=70"
                srcSet={[640, 900, 1280]
                  .map((w) => `https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=${w}&h=${Math.round(w * 0.733)}&q=70 ${w}w`)
                  .join(', ')}
                sizes="(max-width: 1024px) calc(100vw - 2rem), 600px"
                width={900}
                height={660}
                alt="Hands with a pen and calculator going over printed bills and a budget sheet on a table"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <RevealText className="font-display font-bold tracking-tight text-4xl sm:text-5xl leading-[1.08]" text="Built for your budget, not a boardroom." />
            <Reveal as="p" className="text-muted-foreground leading-relaxed max-w-lg">
              Most money apps are built for spreadsheets and quarterly reviews. FinTrack is built for the coffee, the
              rent, and the weekly shop, so a month never surprises you.
            </Reveal>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl chrome-green bg-primary text-primary-foreground">
              <p className="text-sm font-medium leading-snug flex-1">
                Set your first budget in about two minutes. No card, no import, no fuss.
              </p>
              <Link
                href="/signup"
                className="shrink-0 bg-primary-foreground text-primary font-semibold text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity text-center"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      <section id="testimonials" className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-7xl mx-auto space-y-14">
          <RevealText className="font-display font-bold tracking-tight text-4xl sm:text-5xl text-center max-w-2xl mx-auto" text="People stopped guessing where their money went." />

          {/* Sample testimonials (placeholder copy until real reviews exist).
              Featured quote on a tinted surface; the other two sit beside it without cards. Stacks below lg. */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
            {[
              {
                quote: "I set an emergency-fund limit and finally stuck to it. First time saving felt automatic instead of painful.",
                name: "Priya Nadkarni",
                role: "Nurse, Manchester",
                initials: "PN",
              },
              {
                quote: "Checking, savings, and cash in one total. The transport budget going red is the only nudge I need.",
                name: "Theo Van Aalten",
                role: "Bike mechanic, Utrecht",
                initials: "TV",
              },
              {
                quote: "Sharing the household budget ended the receipts argument. We both see the same numbers now.",
                name: "Lena Okafor",
                role: "Teacher, Lagos",
                initials: "LO",
              },
            ].map((t, i) => {
              const lead = i === 0;
              return (
                <figure
                  key={t.name}
                  className={
                    lead
                      ? `chrome-green relative isolate overflow-hidden lg:col-span-7 lg:row-span-2 p-8 sm:p-10 ${SURFACE} flex flex-col justify-between gap-10 text-white`
                      : "lg:col-span-5 pt-6 border-t border-border flex flex-col justify-between gap-5 transition-colors duration-300 hover:border-primary"
                  }
                >
                  <blockquote
                    className={
                      lead
                        ? "font-display font-semibold tracking-tight text-2xl sm:text-3xl leading-snug text-balance"
                        : "text-base leading-relaxed"
                    }
                  >
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full text-xs font-semibold flex items-center justify-center ${lead ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`} aria-hidden="true">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className={`text-xs ${lead ? 'text-white/80' : 'text-muted-foreground'}`}>{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. PRICING */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <RevealText className="font-display font-bold tracking-tight text-4xl sm:text-5xl" text="Simple plans. Cancel anytime." />
            <div className="inline-flex items-center gap-3">
              <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <button
                type="button"
                role="switch"
                aria-checked={billingCycle === "yearly"}
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative w-12 h-6 rounded-full bg-muted border border-border p-0.5 flex items-center before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                aria-label="Bill yearly"
              >
                <span className={`w-5 h-5 rounded-full bg-primary transition-transform ${billingCycle === "yearly" ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-sm font-medium ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly <span className="text-primary">save up to 20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {[
              {
                name: "Free",
                price: "0",
                blurb: "For getting your first month under control.",
                features: ["One account", "Up to 6 category budgets", "Monthly spending trends", "Manual entry"],
                highlight: false,
                cta: "Start free",
              },
              {
                name: "Plus",
                price: billingCycle === "monthly" ? "6" : "5",
                blurb: "For running your whole financial month.",
                features: ["Unlimited accounts", "Unlimited category budgets", "Budgeting assistant", "Recurring bill reminders", "CSV export"],
                highlight: true,
                cta: "Start free",
              },
              {
                name: "Household",
                price: billingCycle === "monthly" ? "10" : "8",
                blurb: "For sharing a budget with the people you live with.",
                features: ["Everything in Plus", "Up to 5 members", "Shared category limits", "Per-person activity"],
                highlight: false,
                cta: "Start free",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 ${SURFACE} flex flex-col justify-between border transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none ${
                  plan.highlight ? "chrome-green text-white shadow-[0_28px_60px_-28px_hsl(var(--primary)/0.7)] lg:-my-3 lg:py-11" : "border-border bg-background"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute top-6 right-6 text-xs font-semibold px-3 py-1 rounded-full bg-white text-[hsl(162_84%_16%)] shadow-sm">
                    Recommended
                  </span>
                )}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
                    <p className={`text-sm mt-1 ${plan.highlight ? 'text-white/85' : 'text-muted-foreground'}`}>{plan.blurb}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold tabular">${plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-white/80' : 'text-muted-foreground'}`}>/ month</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 ${plan.highlight ? 'text-white' : 'text-primary'}`} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className={`mt-8 w-full text-center text-sm font-semibold py-3 rounded-full transition-all active:translate-y-px ${
                    plan.highlight
                      ? "chrome-sheen bg-white text-[hsl(162_84%_16%)] shadow-[0_10px_24px_-14px_hsl(165_84%_6%_/_0.8)] hover:bg-white/95"
                      : "chrome-green chrome-sheen bg-primary text-primary-foreground"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DATA OWNERSHIP */}
      <section id="data" className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="max-w-2xl space-y-4">
            <RevealText className="font-display font-bold tracking-tight text-4xl sm:text-5xl leading-[1.08]" text="Your numbers stay yours." />
            <Reveal as="p" className="text-muted-foreground leading-relaxed">
              The controls for your data live in Settings, where you can reach them yourself.
            </Reveal>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {[
              { icon: Cloud, title: "Synced to your account", body: "Sign in on another device and your wallets, budgets and bills are already there." },
              { icon: HardDrive, title: "A copy on your device", body: "If sync is unavailable, entries are saved locally and uploaded once it works again." },
              { icon: Download, title: "Export any time", body: "Download your transactions as CSV, or everything as a JSON backup." },
              { icon: Trash2, title: "Delete everything", body: "One action removes your transactions, bills, wallets and transfers." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="group border-l border-border pl-6 space-y-2 transition-colors hover:border-primary">
                  <Icon className="w-5 h-5 text-primary transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transform-none" aria-hidden="true" />
                  <dt className="font-display font-semibold text-lg pt-2">{item.title}</dt>
                  <dd className="text-sm text-muted-foreground leading-relaxed">{item.body}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="px-4 sm:px-6 lg:px-8 py-24 bg-card border-y border-border">
        <div className="max-w-3xl mx-auto space-y-12">
          <RevealText className="font-display font-bold tracking-tight text-4xl sm:text-5xl text-center" text="Questions, answered." />
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index}>
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="group w-full flex items-center justify-between gap-4 py-5 text-left font-medium hover:text-primary transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-28 text-center overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-7 relative z-10">
          <RevealText className="font-display font-bold tracking-tight text-5xl sm:text-6xl leading-[1.05]" text="Take control of your money." />
          <Reveal as="p" className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            Set your budgets, watch the month unfold, and let the assistant catch what slips. Free to start.
          </Reveal>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full chrome-green bg-primary text-primary-foreground font-semibold text-sm chrome-sheen active:translate-y-px transition-all"
            >
              Start free
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-border font-medium text-sm hover:bg-muted transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
        <div aria-hidden="true" className="absolute -bottom-4 left-0 right-0 font-display font-bold text-[16vw] tracking-tighter leading-none pointer-events-none select-none text-foreground/[0.03]">
          FINTRACK
        </div>
      </section>

      <NewsletterSection />
    </MarketingLayout>
  );
}
