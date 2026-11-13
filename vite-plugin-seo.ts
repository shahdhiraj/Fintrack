/**
 * Build step for search engines and link previews. After `vite build` it:
 *  - rewrites the <!-- seo:start --> ... <!-- seo:end --> block of dist/index.html for "/",
 *  - writes one HTML file per route (features.html, login.html, dashboard.html, ...) with that
 *    route's title, description, robots, Open Graph and Twitter tags, so crawlers that do not
 *    run JavaScript still see the right metadata. Firebase serves them via "cleanUrls",
 *  - writes 404.html (noindex) so unknown URLs get a real 404 status and the app's 404 page,
 *  - writes robots.txt, and sitemap.xml once the production domain is known.
 *
 * Canonical URLs, og:url, og:image and structured data need an absolute origin. Until
 * VITE_SITE_URL is set they are left out rather than pointing at a guessed domain.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { DEFAULT_DESCRIPTION, NOT_FOUND_META, OG_IMAGE, PAGES, SITE_NAME, siteOrigin, type PageMeta } from './src/seo/pages';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Meta = Pick<PageMeta, 'title' | 'description' | 'index'> & { path: string | null };

function headFor(meta: Meta, origin: string | null): string {
  const url = origin && meta.path ? `${origin}${meta.path === '/' ? '/' : meta.path}` : null;
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    meta.index ? null : `<meta name="robots" content="noindex, follow" />`,
    meta.index && url ? `<link rel="canonical" href="${url}" />` : null,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    url ? `<meta property="og:url" content="${url}" />` : null,
    origin ? `<meta property="og:image" content="${origin}${OG_IMAGE.path}" />` : null,
    origin ? `<meta property="og:image:width" content="${OG_IMAGE.width}" />` : null,
    origin ? `<meta property="og:image:height" content="${OG_IMAGE.height}" />` : null,
    origin ? `<meta property="og:image:alt" content="${esc(OG_IMAGE.alt)}" />` : null,
    `<meta name="twitter:card" content="${origin ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
  ];

  // Structured data on the homepage only, and only facts the site states: its name, address
  // and that it is a web budgeting app. No prices or ratings: plans are not live and there are
  // no verified reviews.
  if (meta.path === '/' && origin) {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': `${origin}/#website`, name: SITE_NAME, url: `${origin}/` },
        {
          '@type': 'WebApplication',
          '@id': `${origin}/#app`,
          name: SITE_NAME,
          url: `${origin}/`,
          description: DEFAULT_DESCRIPTION,
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any (web browser)',
          browserRequirements: 'Requires JavaScript.',
        },
      ],
    };
    tags.push(`<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`);
  }
  return tags.filter(Boolean).join('\n    ');
}

const BLOCK = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;


export function seoPlugin(rawOrigin: string | undefined): Plugin {
  const origin = siteOrigin(rawOrigin);
  let outDir = 'dist';

  return {
    name: 'fintrack-seo',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      const template = fs.readFileSync(indexPath, 'utf8');
      if (!BLOCK.test(template)) throw new Error('[fintrack-seo] index.html is missing the <!-- seo:start --> block');
      const render = (meta: Meta) =>
        template.replace(BLOCK, `<!-- seo:start -->\n    ${headFor(meta, origin)}\n    <!-- seo:end -->`);

      const written: string[] = [];
      for (const page of PAGES) {
        const file = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
        fs.writeFileSync(path.join(outDir, file), render(page));
        written.push(file);
      }
      fs.writeFileSync(path.join(outDir, '404.html'), render({ ...NOT_FOUND_META, path: null }));
      written.push('404.html');

      const disallow = [...PAGES.filter((p) => p.kind === 'app').map((p) => p.path), '/landing-pages/'];
      const robots = [
        'User-agent: *',
        'Allow: /',
        ...disallow.map((p) => `Disallow: ${p}`),
        '',
        origin ? `Sitemap: ${origin}/sitemap.xml` : '# Sitemap: pending. Set VITE_SITE_URL and rebuild to add it.',
        '',
      ].join('\n');
      fs.writeFileSync(path.join(outDir, 'robots.txt'), robots);
      written.push('robots.txt');

      if (origin) {
        const today = new Date().toISOString().slice(0, 10);
        const urls = PAGES.filter((p) => p.index)
          .map((p) => `  <url><loc>${origin}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod></url>`)
          .join('\n');
        fs.writeFileSync(
          path.join(outDir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        );
        written.push('sitemap.xml');
      } else {
        this.warn(
          'VITE_SITE_URL is not set (production domain pending). Skipped: canonical URLs, og:url, og:image, structured data and sitemap.xml. Add VITE_SITE_URL=https://your-domain to .env.production and rebuild.',
        );
      }
      console.log(`[fintrack-seo] wrote ${written.length} files: ${written.join(', ')}`);
    },
  };
}
