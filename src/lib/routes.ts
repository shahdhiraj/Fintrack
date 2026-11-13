import { PAGES, normalizePath } from '../seo/pages';

const APP_PATHS = PAGES.filter((p) => p.kind === 'app').map((p) => p.path);
const AUTH_PATHS = PAGES.filter((p) => p.kind === 'auth').map((p) => p.path);

/** Signed-in pages: shown inside the sidebar shell and redirected to /login when signed out. */
export function isAppRoute(pathname: string): boolean {
  const p = normalizePath(pathname);
  return APP_PATHS.some((r) => p === r || p.startsWith(`${r}/`));
}

/** /login and /signup: signed-in users are sent on to the dashboard. */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_PATHS.includes(normalizePath(pathname));
}
