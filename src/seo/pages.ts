/**
 * Single source of truth for every route: its <title>, meta description, and whether
 * search engines should index it. Read by the app at runtime (src/seo/route-seo.tsx),
 * by the router guards (src/lib/routes.ts), and by the build (vite-plugin-seo.ts) to
 * write one static HTML file per route plus robots.txt and sitemap.xml.
 *
 * Keep this file free of React and of "@/..." imports: vite.config.ts imports it.
 * When you add a page, add it here AND as a <Route> in src/main.tsx.
 */

export const SITE_NAME = 'FinTrack';

export const DEFAULT_DESCRIPTION =
  'FinTrack is a personal budgeting app. Track spending, set a monthly limit for each category, and get warned before a budget slips.';

export type RouteKind = 'marketing' | 'auth' | 'app';

export type PageMeta = {
  path: string;
  kind: RouteKind;
  /** Full document title. */
  title: string;
  description: string;
  /** false adds <meta name="robots" content="noindex"> and keeps the page out of the sitemap. */
  index: boolean;
};

export const PAGES: PageMeta[] = [
  {
    path: '/',
    kind: 'marketing',
    title: 'FinTrack: personal budgeting with monthly category limits',
    description: DEFAULT_DESCRIPTION,
    index: true,
  },
  {
    path: '/features',
    kind: 'marketing',
    title: 'Features: budgets, wallets, bills and reports | FinTrack',
    description:
      'Everything FinTrack does: transactions, monthly budgets, savings goals, wallets, recurring bills, debts and loans, monthly reports and trends, and CSV, JSON or PDF export.',
    index: true,
  },
  {
    // Alternative landing concept with placeholder branding. Reachable, never indexed.
    path: '/hero',
    kind: 'marketing',
    title: 'Landing concept | FinTrack',
    description: 'An alternative FinTrack landing page concept.',
    index: false,
  },
  { path: '/login', kind: 'auth', title: 'Log in | FinTrack', description: 'Log in to your FinTrack account.', index: false },
  { path: '/signup', kind: 'auth', title: 'Create your free account | FinTrack', description: 'Create a free FinTrack account and set your first monthly budget.', index: false },

  // Signed-in app. Never indexed; robots.txt also asks crawlers to skip them.
  { path: '/dashboard', kind: 'app', title: 'Dashboard | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/budgets', kind: 'app', title: 'Budgets & Goals | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/transactions', kind: 'app', title: 'Transactions | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/wallets', kind: 'app', title: 'Wallets | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/reports', kind: 'app', title: 'Reports | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/recurring', kind: 'app', title: 'Recurring Bills | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/debts', kind: 'app', title: 'Debts & Loans | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/feedback', kind: 'app', title: 'Feedback | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/settings', kind: 'app', title: 'Settings | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/help', kind: 'app', title: 'Help Desk | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
  { path: '/profile', kind: 'app', title: 'Profile | FinTrack', description: DEFAULT_DESCRIPTION, index: false },
];

export const NOT_FOUND_META: Omit<PageMeta, 'path' | 'kind'> = {
  title: 'Page not found | FinTrack',
  description: 'This page does not exist. Find your way back to FinTrack.',
  index: false,
};

/** "/features/" -> "/features"; "" -> "/". */
export function normalizePath(path: string): string {
  const p = path.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export function findPage(path: string): PageMeta | undefined {
  const p = normalizePath(path);
  return PAGES.find((page) => page.path === p);
}

/** Production origin without a trailing slash, or null while the domain is pending. */
export function siteOrigin(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().replace(/\/+$/, '');
  return /^https:\/\/[^/\s[\]]+$/.test(value) ? value : null;
}

/** Social card image, served from /public. Only advertised once the origin is known (must be absolute). */
export const OG_IMAGE = { path: '/og-image.jpg', width: 1200, height: 630, alt: 'FinTrack: know exactly where your money goes.' };
