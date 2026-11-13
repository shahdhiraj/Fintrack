/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register';
import { isAppRoute } from '@/lib/routes';

let registered = false;

/**
 * Register the service worker only where it helps: inside the signed-in app, or when the
 * app was opened from an installed icon. Marketing visitors never download the offline cache,
 * which would otherwise pull every app page in the background.
 */
export function maybeRegisterServiceWorker(pathname: string) {
  if (registered || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  if (!standalone && !isAppRoute(pathname)) return;
  registered = true;
  // New versions activate on their own; the next navigation picks them up.
  registerSW({ immediate: true });
}
