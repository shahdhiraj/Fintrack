'use client';

import Link from "next/link";
import Image from "next/image";
import {
  Wallet,
  Sparkles,
  ArrowUpRight,
  Play,
  Star,
  Check,
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  Globe,
  Send,
  Loader2,
  ChevronDown,
  Receipt,
  Target,
  Bot,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

// Counts a figure up once it scrolls into view.
function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(to);
      return;
    }
    let startTime: number;
    let animationFrameId: number;
    const duration = 1400;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setValue(easeOut * to);
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setValue(to);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [inView, to, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

// Subtle pointer-tracked tilt. Reserved for the two hero-weight surfaces only.
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 26, mass: 0.4 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        rotateX: reduce ? 0 : rotateX,
        rotateY: reduce ? 0 : rotateY,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      }}
    >
      <div className="h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
}

const faqs = [
  {
    question: "How do transactions get into FinTrack?",
    answer:
      "Add income and expenses in a few taps, with amount, date, and category. FinTrack suggests a category based on past entries, and you can always change it.",
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

const features = [
  {
    icon: Receipt,
    title: "Log it in seconds",
    body: "Enter an expense with amount, date, and category before you forget it. Categories fill in automatically.",
  },
  {
    icon: Target,
    title: "Set envelope budgets",
    body: "Give each category a monthly limit and watch a clear progress bar fill as you spend.",
  },
  {
    icon: LineChart,
    title: "See the trend",
    body: "Charts show where money went this month and how that compares to the last few.",
  },
  {
    icon: Bot,
    title: "Ask the assistant",
    body: "Get plain suggestions on limits to adjust and subscriptions worth cutting.",
  },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const [convertFrom, setConvertFrom] = useState("1000");
  const [convertTo, setConvertTo] = useState("892.50");

  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Hi, I'm your budgeting assistant. Looking at last month, you spent $640 on dining against a $500 plan. Ask me anything about your budget.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handleCurrencyChange = (val: string) => {
    setConvertFrom(val);
    const parsed = parseFloat(val);
    setConvertTo(!isNaN(parsed) ? (parsed * 0.8925).toFixed(2) : "0.00");
  };

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
          "Dining is your loosest category. Drop the limit from $640 to $500 and you free up $140 a month without touching essentials.";
      } else if (q.includes("subscription") || q.includes("recurring")) {
        reply =
          "I found two overlapping streaming charges totalling $27 a month. Cancelling one keeps you inside your entertainment limit.";
      } else if (q.includes("account") || q.includes("balance")) {
        reply =
          "Across checking and savings you have $20,730 available. Your safe-to-spend for the rest of this month is $410.";
      } else {
        reply =
          "At your current pace you'll end the month about $180 under budget. Keep that up and it covers a month of groceries by spring.";
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

  const isDark = mounted && theme === "dark";

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary selection:text-primary-foreground">

      {/* 1. NAVIGATION */}
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="w-full max-w-7xl rounded-full pl-5 pr-3 py-2.5 flex items-center justify-between border border-border bg-card/85 backdrop-blur-xl shadow-[0_10px_30px_-18px_hsl(150_24%_7%_/_0.4)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-lg font-display font-bold tracking-tight">FinTrack</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <a href="#overview" className="px-3.5 py-1.5 rounded-full hover:text-foreground transition-colors">Overview</a>
            <a href="#how" className="px-3.5 py-1.5 rounded-full hover:text-foreground transition-colors">How it works</a>
            <a href="#dashboard" className="px-3.5 py-1.5 rounded-full hover:text-foreground transition-colors">Dashboard</a>
            <a href="#pricing" className="px-3.5 py-1.5 rounded-full hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="px-3.5 py-1.5 rounded-full hover:text-foreground transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 active:translate-y-px transition-all"
            >
              Start free
            </Link>
          </div>
        </nav>
      </header>

      {/* 2. HERO */}
      <section id="overview" className="relative px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-accent/60 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center relative">

          <div className="lg:col-span-7 space-y-7">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4" />
              Personal budgeting, made calm
            </span>

            <h1 className="font-display font-bold tracking-tight leading-[1.05] text-5xl sm:text-6xl lg:text-[4.25rem]">
              Know exactly where
              <br />
              your <span className="text-gradient">money goes.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
              Track spending, set a limit for each category, and get quiet nudges when a budget starts slipping.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3.5 rounded-full hover:bg-primary/90 active:translate-y-px transition-all"
              >
                Start free
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setVideoModalOpen(true)}
                className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground px-4 py-3.5 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </span>
                See it work
              </button>
            </div>

            <div className="flex items-center gap-8 pt-4 border-t border-border">
              <div>
                <div className="flex items-center gap-1 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">
                  <span className="font-semibold text-foreground tabular">4.8</span> average from early users
                </p>
              </div>
              <div className="flex items-center -space-x-2.5">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
                ].map((url, i) => (
                  <div key={i} className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-card">
                    <Image src={url} alt="Person using FinTrack" fill sizes="36px" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product preview: single device with real app content */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-[280px] sm:w-[300px]">
              <div className="absolute top-16 -left-6 sm:-left-16 z-20 rounded-2xl bg-card border border-border px-4 py-3 shadow-[0_18px_40px_-22px_hsl(150_24%_7%_/_0.4)] flex items-center gap-3 max-w-[210px]">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <p className="text-xs font-medium leading-snug">Groceries on track: $412 of $500.</p>
              </div>

              <TiltCard className="relative z-10 w-full">
              <div className="w-full rounded-[2.25rem] bg-card border border-border p-2 shadow-[0_40px_80px_-40px_hsl(150_24%_7%_/_0.5)]">
                <div className="rounded-[1.75rem] overflow-hidden bg-background border border-border">
                  <div className="px-5 pt-4 pb-3 flex justify-between items-center text-xs text-muted-foreground tabular">
                    <span>9:41</span>
                    <span>5G</span>
                  </div>

                  <div className="px-5 pb-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                          MR
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Good morning</p>
                          <p className="text-sm font-semibold">Mara Reyes</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-primary text-primary-foreground p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs opacity-90">
                        <span>Safe to spend</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> on track</span>
                      </div>
                      <div className="text-3xl font-display font-bold tabular">$410.00</div>
                      <svg className="w-full h-10" viewBox="0 0 200 44" fill="none">
                        <path d="M0 34 Q40 12 80 24 T160 8 T200 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
                      </svg>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>This month's budgets</span>
                        <span>View all</span>
                      </div>
                      {[
                        { label: "Groceries", spent: "412", limit: "500", pct: 82, over: false },
                        { label: "Dining", spent: "90", limit: "300", pct: 30, over: false },
                        { label: "Transport", spent: "168", limit: "150", pct: 100, over: true },
                      ].map((b) => (
                        <div key={b.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{b.label}</span>
                            <span className={`tabular ${b.over ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                              ${b.spent} / ${b.limit}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${b.over ? "bg-destructive" : "bg-primary"}`}
                              style={{ width: `${b.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE STRIP */}
      <section id="how" className="px-4 sm:px-6 lg:px-8 py-16 border-y border-border bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-card p-7 space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-semibold text-lg">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. STORY */}
      <section id="about" className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <div className="relative rounded-[2rem] overflow-hidden border border-border h-[380px] sm:h-[440px]">
              <Image
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
                alt="Reviewing a monthly budget at a kitchen table"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <h2 className="font-display font-bold tracking-tight text-4xl sm:text-5xl leading-[1.08]">
              Built for your budget,
              <br />
              not a boardroom.
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-lg">
              Most money apps are built for spreadsheets and quarterly reviews. FinTrack is built for the coffee, the
              rent, and the weekly shop, so a month never surprises you.
            </p>

            <div className="space-y-5">
              {[
                { title: "Give every category a limit", body: "Rent, groceries, fun. Decide what each is worth this month." },
                { title: "Watch the room you have left", body: "A progress bar per category means you always know your safe-to-spend." },
                { title: "Adjust with a nudge, not a lecture", body: "The assistant flags what is slipping and suggests a fix in plain words." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-primary text-primary-foreground">
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

        {/* Honest product facts (illustrative, not performance metrics) */}
        <div className="max-w-7xl mx-auto mt-20 pt-12 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: <CountUp to={2} suffix=" min" />, label: "To set up your first month of budgets." },
            { value: <CountUp to={12} />, label: "Spending categories you can shape to your life." },
            { value: <>All</>, label: "Your accounts, added up into one honest total." },
            { value: <>Yours</>, label: "Data you can export or delete at any time." },
          ].map((s, i) => (
            <div key={i} className="space-y-3">
              <div className="w-10 h-0.5 bg-primary rounded-full" />
              <div className="text-3xl sm:text-4xl font-display font-bold tracking-tight tabular">{s.value}</div>
              <p className="text-sm text-muted-foreground leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CAPABILITIES (photo cards) */}
      <section id="services" className="px-4 sm:px-6 lg:px-8 py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="max-w-2xl space-y-4">
            <h2 className="font-display font-bold tracking-tight text-4xl sm:text-5xl">
              Everything a month of money needs.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Three things you will actually do in FinTrack, from the first expense to the end-of-month review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
                icon: Receipt,
                title: "Record what you spend",
                note: "Income and expenses",
              },
              {
                img: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=800&q=80",
                icon: Target,
                title: "Hold your limits",
                note: "Monthly envelopes",
              },
              {
                img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
                icon: PieChart,
                title: "Review the month",
                note: "Trends and insights",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="relative rounded-[1.75rem] overflow-hidden min-h-[400px] flex flex-col justify-end p-5 border border-border group">
                  <Image
                    src={card.img}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(150_28%_8%_/_0.88)] via-[hsl(150_28%_8%_/_0.35)] to-transparent" />
                  <div className="relative z-10 flex items-center gap-3 rounded-2xl bg-card/95 backdrop-blur border border-border p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">{card.title}</h3>
                      <p className="text-xs text-muted-foreground">{card.note}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. LIVE DASHBOARD */}
      <section id="dashboard" className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4" />
              Try it right here
            </span>
            <h2 className="font-display font-bold tracking-tight text-4xl sm:text-5xl">
              Your month, at a glance.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This is the real dashboard, running live. Change the converter, or ask the assistant a question.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Metrics + charts */}
            <div className="lg:col-span-8">
              <TiltCard>
                <div className="rounded-[1.75rem] border border-border bg-card p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl border border-border">
                      <p className="text-xs text-muted-foreground">Income</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-display font-bold tabular">$8,450</span>
                        <span className="text-xs text-primary font-medium flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" />+12%</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl border border-border">
                      <p className="text-xs text-muted-foreground">Expenses</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-display font-bold tabular">$3,120</span>
                        <span className="text-xs text-primary font-medium flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" />-4%</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary text-primary-foreground">
                      <p className="text-xs opacity-90">Net saved</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-display font-bold tabular">$5,330</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-foreground/20">On track</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl border border-border space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Weekly cash flow</span>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-primary mr-1" />In</span>
                          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-muted-foreground/50 mr-1" />Out</span>
                        </div>
                      </div>
                      <svg className="w-full h-28" viewBox="0 0 300 100" fill="none">
                        <defs>
                          <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 80 Q50 35 100 60 T200 20 T300 30 L300 100 L0 100 Z" fill="url(#flowGrad)" />
                        <path d="M0 80 Q50 35 100 60 T200 20 T300 30" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M0 88 Q50 76 100 80 T200 66 T300 72" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                      </svg>
                    </div>

                    <div className="p-5 rounded-2xl border border-border space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Category limits</span>
                        <span className="text-xs text-muted-foreground">This month</span>
                      </div>
                      {[
                        { label: "Housing", amt: "$1,200", pct: 38, over: false },
                        { label: "Groceries", amt: "$640", pct: 64, over: false },
                        { label: "Transport", amt: "$168", pct: 100, over: true },
                      ].map((row) => (
                        <div key={row.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{row.label}</span>
                            <span className={`tabular font-medium ${row.over ? "text-destructive" : "text-foreground"}`}>{row.amt}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${row.over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${row.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Multi-currency</p>
                        <p className="text-xs text-muted-foreground">Live mid-market rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm">
                        <span className="text-xs text-muted-foreground">USD</span>
                        <input
                          type="number"
                          value={convertFrom}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          aria-label="Amount in US dollars"
                          className="w-20 bg-transparent font-medium tabular outline-none text-right"
                        />
                      </label>
                      <span className="text-muted-foreground">=</span>
                      <div className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium tabular">
                        &euro;{convertTo}
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </div>

            {/* Assistant */}
            <div className="lg:col-span-4">
              <div className="rounded-[1.75rem] border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Budgeting assistant</h3>
                    <p className="text-xs text-muted-foreground">Ask about your month</p>
                  </div>
                </div>

                <div className="h-[280px] overflow-y-auto space-y-3 pr-1 no-scrollbar">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
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
                  <div ref={chatEndRef} />
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
                    className="w-10 h-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:translate-y-px transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {["How can I save more?", "Any wasteful subscriptions?", "What's my balance?"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setInputValue(chip)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
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

      {/* 7. PRICING */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <h2 className="font-display font-bold tracking-tight text-4xl sm:text-5xl">
              Simple plans. Cancel anytime.
            </h2>
            <div className="inline-flex items-center gap-3">
              <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="w-12 h-6 rounded-full bg-muted border border-border p-0.5 flex items-center"
                aria-label="Toggle billing period"
              >
                <span className={`w-5 h-5 rounded-full bg-primary transition-transform ${billingCycle === "yearly" ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-sm font-medium ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly <span className="text-primary">save 20%</span>
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
                features: ["Unlimited accounts", "Unlimited category budgets", "Budgeting assistant", "Multi-currency", "CSV export"],
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
                className={`relative p-8 rounded-[1.75rem] flex flex-col justify-between border ${
                  plan.highlight ? "border-primary bg-background ring-1 ring-primary" : "border-border bg-background"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute top-6 right-6 text-xs font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.blurb}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold tabular">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/ month</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className={`mt-8 w-full text-center text-sm font-semibold py-3 rounded-full transition-all active:translate-y-px ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      <section id="testimonials" className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-7xl mx-auto space-y-14">
          <h2 className="font-display font-bold tracking-tight text-4xl sm:text-5xl text-center max-w-2xl mx-auto">
            People stopped guessing where their money went.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            ].map((t) => (
              <figure key={t.name} className="p-7 rounded-[1.5rem] border border-border bg-card flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-0.5 text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                </div>
                <figcaption className="flex items-center gap-3 pt-5 mt-5 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="px-4 sm:px-6 lg:px-8 py-24 bg-card border-y border-border">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="font-display font-bold tracking-tight text-4xl sm:text-5xl text-center">
            Questions, answered.
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index}>
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left font-medium hover:text-primary transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
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
          <h2 className="font-display font-bold tracking-tight text-5xl sm:text-6xl leading-[1.05]">
            Take control of<br />your money.
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            Set your budgets, watch the month unfold, and let the assistant catch what slips. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:translate-y-px transition-all"
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
        <div className="absolute -bottom-4 left-0 right-0 font-display font-bold text-[16vw] tracking-tighter leading-none pointer-events-none select-none text-foreground/[0.03]">
          FINTRACK
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="px-4 sm:px-6 lg:px-8 pt-16 pb-8 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
            <div className="md:col-span-5 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-lg font-display font-bold tracking-tight">FinTrack</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Track spending, hold your limits, and keep a calm view of everything your money does.
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold mb-4">Product</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#dashboard" className="hover:text-foreground transition-colors">Dashboard</a></li>
                <li><a href="#how" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold mb-4">Company</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-sm font-semibold mb-4">Get started</h3>
              <div className="flex flex-col items-start gap-2.5 text-sm">
                <Link href="/signup" className="text-primary font-medium hover:underline">Create a free account</Link>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Log in to your dashboard</Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} FinTrack</span>
            <div className="flex items-center gap-6">
              <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
              <a href="mailto:support@fintrack.app" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo modal */}
      <AnimatePresence>
        {videoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-[1.5rem] p-6 max-w-lg w-full space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary fill-current" />
                  FinTrack in a minute
                </h3>
                <button
                  onClick={() => setVideoModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <div className="h-64 rounded-2xl bg-muted flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <LineChart className="w-6 h-6" />
                </div>
                <p className="font-medium">The live dashboard is right on this page.</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Scroll to the dashboard section to change the converter and ask the assistant a real question.
                </p>
                <button
                  onClick={() => {
                    setVideoModalOpen(false);
                    document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Go to the dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
