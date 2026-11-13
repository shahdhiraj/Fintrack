import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NOT_FOUND_META, OG_IMAGE, SITE_NAME, findPage, normalizePath, siteOrigin } from './pages';

const ORIGIN = siteOrigin(import.meta.env.VITE_SITE_URL);

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Keeps <head> in step with client-side navigation: title, description, robots, Open Graph,
 * Twitter card and canonical. The build writes the same tags into each route's HTML file
 * (vite-plugin-seo.ts), so crawlers that do not run JavaScript see them too.
 */
export function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = normalizePath(pathname);
    const page = findPage(path);
    const meta = page ?? NOT_FOUND_META;
    const url = ORIGIN && page ? `${ORIGIN}${path === '/' ? '/' : path}` : null;

    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', meta.index ? null : 'noindex, follow');
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', ORIGIN ? `${ORIGIN}${OG_IMAGE.path}` : null);
    setMeta('name', 'twitter:card', ORIGIN ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setCanonical(meta.index ? url : null);
  }, [pathname]);

  return null;
}
