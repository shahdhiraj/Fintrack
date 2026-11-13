import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';
import { seoPlugin } from './vite-plugin-seo';

export default defineConfig(({ mode }) => ({
  // VITE_SITE_URL is the production origin, e.g. https://fintrack.app (see .env.example).
  plugins: [
    react(),
    seoPlugin(loadEnv(mode, process.cwd(), '').VITE_SITE_URL),
    // Installable app: manifest, icons and an offline-capable service worker.
    // The worker is registered from src/pwa.ts, only inside the app or the installed app.
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'FinTrack: personal budgeting',
        short_name: 'FinTrack',
        description: 'Track spending, set a monthly limit for each category, and get warned before a budget slips.',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        background_color: '#f3f6f5',
        theme_color: '#f3f6f5',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Transactions', url: '/transactions', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          { name: 'Budgets', url: '/budgets', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          { name: 'Reports', url: '/reports', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // App code and icons; route HTML files are served by the network-first navigation fallback.
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}', 'index.html'],
        globIgnores: ['landing-pages/**', 'og-image.jpg'],
        navigateFallback: '/index.html',
        // Never intercept Firebase's auth helpers, static pages, or files.
        navigateFallbackDenylist: [/^\/__\//, /^\/landing-pages\//, /\.[a-z0-9]+$/i],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Pre-bundle heavy deps at startup so opening a lazy page never triggers a dev reload.
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'recharts',
      'date-fns',
      '@tanstack/react-table',
      'lucide-react',
      'next-themes',
    ],
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: these rarely change, so browsers keep them cached between deploys.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // recharts is deliberately not grouped: it would drag shared helpers (e.g. clsx)
          // with it and get preloaded on every page. Left alone, it loads only with chart pages.
          radix: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog',
          ],
        },
      },
    },
  },
}));
