import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './index.css';
import { ClientLayout } from '@/components/client-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteSeo } from '@/seo/route-seo';
import { isAppRoute } from '@/lib/routes';
import { maybeRegisterServiceWorker } from '@/pwa';

// Each page is its own chunk, so the first load only downloads what it shows.
const pages = {
  landing: () => import('@/pages/Landing'),
  hero: () => import('@/pages/Hero'),
  features: () => import('@/pages/Features'),
  login: () => import('@/pages/Login'),
  signup: () => import('@/pages/Signup'),
  dashboard: () => import('@/pages/Dashboard'),
  budgets: () => import('@/pages/Budgets'),
  transactions: () => import('@/pages/Transactions'),
  wallets: () => import('@/pages/Wallets'),
  reports: () => import('@/pages/Reports'),
  recurring: () => import('@/pages/Recurring'),
  debts: () => import('@/pages/Debts'),
  feedback: () => import('@/pages/Feedback'),
  settings: () => import('@/pages/Settings'),
  help: () => import('@/pages/Help'),
  profile: () => import('@/pages/Profile'),
  notFound: () => import('@/pages/NotFound'),
};

const Landing = lazy(pages.landing);
const Hero = lazy(pages.hero);
const Features = lazy(pages.features);
const Login = lazy(pages.login);
const Signup = lazy(pages.signup);
const Dashboard = lazy(pages.dashboard);
const Budgets = lazy(pages.budgets);
const Transactions = lazy(pages.transactions);
const Wallets = lazy(pages.wallets);
const Reports = lazy(pages.reports);
const Recurring = lazy(pages.recurring);
const Debts = lazy(pages.debts);
const Feedback = lazy(pages.feedback);
const Settings = lazy(pages.settings);
const Help = lazy(pages.help);
const Profile = lazy(pages.profile);
const NotFound = lazy(pages.notFound);

// What to fetch in the background once the first page is idle. Visitors on public pages
// get the other public pages and the auth forms; signed-in pages stay off their network.
const PUBLIC_NEXT = [pages.landing, pages.features, pages.login, pages.signup, pages.notFound];
const APP_NEXT = [pages.dashboard, pages.budgets, pages.transactions, pages.wallets, pages.reports, pages.recurring, pages.debts, pages.settings];

/** After the first page is up, quietly fetch the likely next pages so navigation is instant. */
function usePrefetchPages() {
  const { pathname } = useLocation();
  const inApp = isAppRoute(pathname);
  useEffect(() => maybeRegisterServiceWorker(pathname), [pathname]);
  useEffect(() => {
    // Respect data-saver and slow connections.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return;
    const run = () => (inApp ? APP_NEXT : PUBLIC_NEXT).forEach((load) => void load().catch(() => undefined));
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const id = idle ? idle(run) : window.setTimeout(run, 1500);
    return () => {
      if (!idle) window.clearTimeout(id);
    };
  }, [inApp]);
}

/**
 * Scroll to top on navigation, or to the element named in the #hash. Lazy pages render their
 * sections a moment later, so look for the target for up to 2 seconds. Focus moves to the
 * target so keyboard and screen-reader users continue from there.
 */
function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
        return;
      }
      if (tries++ < 40) timer = window.setTimeout(attempt, 50);
    };
    timer = window.setTimeout(attempt, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, hash, key]);
  return null;
}

function PageFallback() {
  return (
    <div className="max-w-7xl mx-auto space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

function App() {
  usePrefetchPages();
  return (
    <ClientLayout>
      <ScrollManager />
      <RouteSeo />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/hero" element={<Hero />} />
          <Route path="/features" element={<Features />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ClientLayout>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
