# FinTrack (Finlo Flash)

Personal budgeting app: **Vite + React 18 + TypeScript**, React Router v6, Tailwind + shadcn/ui, Firebase Auth + Firestore. It is a static single-page app (no server). It was migrated from Next.js in Nov 2026, so ignore any Next.js conventions you remember.

## Commands
- `npm run dev`: Vite dev server on http://localhost:3000 (it picks the next free port if 3000 is busy)
- `npm run build`: type-check (`tsc --noEmit`) then production build into `dist/`
- `npm run preview`: serve the built `dist/`
- `npm run deploy:rules`: deploy `firestore.rules` (needs `npx firebase-tools login`)
- `npm run deploy:hosting`: build and deploy `dist/` to Firebase Hosting

## Layout
- `src/main.tsx`: router; every page in `src/pages/` is lazy-loaded; when the browser is idle it prefetches the likely next pages (public pages for visitors, app pages for signed-in users)
- `src/components/client-layout.tsx`: providers; `app-shell.tsx` is the sidebar and header
- `src/context/transaction-context.tsx`: all app data (transactions, bills, wallets, transfers, budgets, savings goals + contributions, debts + payments, feedback, preferences). Goals and debts are tracking only: they never move wallet money, except a debt payment saved with "Also add to transactions", which creates (and on delete removes) a linked transaction.
- Goals, debts and trends maths: `src/lib/goals.ts`, `src/lib/debts.ts`, `src/lib/trends.ts` (pure). UI: Budgets page `?tab=goals` (`src/components/goals/`), `/debts` page, Trends section in Reports.
- `src/firebase/use-synced-store.tsx`: Firestore-first storage that falls back to localStorage when rules deny a collection, then uploads the local data once access works
- `src/lib/finance.ts`, `src/lib/budgets.ts`: pure logic (unit-testable, no React/Firebase)
- Money: always format with `formatMoney` / `formatMoneyRounded` / `formatMoneyCompact` from `src/lib/currency.ts` (re-exported by `@/lib/utils`), never a hard-coded `$` or `Intl` currency. The display currency is a user preference (default Nepalese rupee, "Nrs.", lakh grouping; custom symbols allowed) applied by `TransactionProvider`. Amounts are stored as plain numbers and never converted.
- Navigation helpers: `@/components/link` (`<Link href>`), `@/components/image`, `@/lib/navigation` (`usePathname`, `useRouter`, `useSearchParams`)
- `src/seo/pages.ts`: the route registry (title, description, indexable, marketing/auth/app). Used by the router guards (`src/lib/routes.ts`), runtime head tags (`src/seo/route-seo.tsx`) and the build (`vite-plugin-seo.ts`). **A new page needs an entry here and a `<Route>` in `src/main.tsx`.** App routes redirect to /login when signed out; everything else (marketing, auth, unknown URLs) is public.
- Public pages use `src/components/marketing/marketing-layout.tsx` (skip link, shared header with mobile menu and active states, footer). Homepage section links are `/#why`, `/#pricing`, etc.

## Notes
- Bills: a bill's picture (`imageUrl`) is either an https link or a 128px WebP thumbnail made in the browser (`src/lib/bill-image.ts`) and stored in the bill document; there is no file storage bucket. "Scan a bill" uses Tesseract.js (`src/lib/ocr.ts`, loaded only when used) to read the photo on the device; the engine and English language data download from jsDelivr / tessdata.projectnaptha.com on first use. Parsing and the total check are pure functions in `src/lib/bill-parse.ts`.
- No server code. `src/lib/actions.ts` returns on-device suggestions; a real AI model would need a backend (e.g. a Cloud Function) so the API key is never shipped to browsers.
- Source files use CRLF line endings.

## Routing, hosting and SEO
- `npm run build` writes one HTML file per route (`features.html`, `dashboard.html`, ...) with that route's head tags, plus `404.html` and `robots.txt`. `firebase.json` serves them with `cleanUrls` and `trailingSlash: false`; there is no catch-all rewrite, so unknown URLs return a real 404 with the app's 404 page.
- Production domain: set `VITE_SITE_URL=https://your-domain` (no trailing slash) in `.env.production` and rebuild. Until then canonical URLs, og:url, og:image, structured data and `sitemap.xml` are skipped on purpose (the build prints a warning). See `.env.example`.
- `npm run dev` and `npm run preview` fall back to index.html for any path, so direct visits work locally too (unknown paths return 200 there, 404 on Firebase).
- Social card: `public/og-image.jpg` (1200x630).

## Installable app (PWA) and Windows desktop app
- PWA: `vite-plugin-pwa` in `vite.config.ts` writes `manifest.webmanifest` and `sw.js`. The service worker is registered by `src/pwa.ts` only on signed-in app routes or when launched from an installed icon, so marketing visitors do not download the offline cache. Icons: `public/pwa-*.png`, `public/apple-touch-icon.png`. Never let the worker handle `/__/*` (Firebase Auth helpers).
- Windows: `npm run desktop` runs the app in Electron; `npm run desktop:build` writes `release/FinTrack-Setup-<version>.exe` (installer) and `release/FinTrack-<version>-portable.exe`. `electron/main.cjs` serves `dist/` from `http://localhost:47821` (fixed port so sign-in and on-device data persist; Firebase Auth allows `localhost`). App data lives in `%APPDATA%\FinTrack`.
- The installers are unsigned, so Windows SmartScreen warns on first run until a code-signing certificate is configured (`build.win` in `package.json`).
- If electron-builder fails extracting `winCodeSign` ("Cannot create symbolic link"), enable Windows Developer Mode or extract the archive into `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0` skipping `*.dylib`.
- Running Electron from a VS Code terminal: VS Code sets `ELECTRON_RUN_AS_NODE=1`, which makes the app start as plain Node ("bad option"). Unset it first.

