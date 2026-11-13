import { db } from './db';
import {
  parseRouteFromPathname,
  buildRouteSeoMeta,
  SeoMeta,
  SeoScholarInfo,
  SeoArticleInfo
} from '../utils/seo';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function resolveSeoForRequestPath(pathname: string): SeoMeta {
  const { route, param } = parseRouteFromPathname(pathname);

  let scholar: SeoScholarInfo | null = null;
  let article: SeoArticleInfo | null = null;

  if (route === 'scholar' && param) {
    try {
      const row = db
        .prepare(
          `SELECT full_name, honorific_title, slug, biography, profile_image
           FROM scholars
           WHERE slug = ? AND is_published = 1
           LIMIT 1`
        )
        .get(param) as SeoScholarInfo | undefined;
      if (row) {
        scholar = row;
      }
    } catch (err) {
      console.error('[SEO] Failed to look up scholar for metadata:', err);
    }
  } else if (route === 'articles' && param) {
    try {
      const row = db
        .prepare(
          `SELECT title, slug, excerpt, content, featured_image
           FROM articles
           WHERE slug = ? AND is_published = 1
           LIMIT 1`
        )
        .get(param) as SeoArticleInfo | undefined;
      if (row) {
        article = row;
      }
    } catch (err) {
      console.error('[SEO] Failed to look up article for metadata:', err);
    }
  }

  return buildRouteSeoMeta({
    route,
    slug: param,
    scholar,
    article
  });
}

function replaceOrInsertHeadTag(
  html: string,
  pattern: RegExp,
  replacementTag: string
): string {
  if (pattern.test(html)) {
    return html.replace(pattern, () => replacementTag);
  }
  return html.replace(/<\/head>/i, () => `    ${replacementTag}\n  </head>`);
}

export function injectSeoIntoHtml(html: string, pathname: string): string {
  const meta = resolveSeoForRequestPath(pathname);

  const safeTitle = escapeHtml(meta.title);
  const safeDescription = escapeHtml(meta.description);
  const safeCanonical = escapeHtml(meta.canonicalUrl);
  const safeRobots = escapeHtml(meta.robots);

  let output = html;

  output = replaceOrInsertHeadTag(
    output,
    /<title>[\s\S]*?<\/title>/i,
    `<title>${safeTitle}</title>`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<link\b[^>]*\brel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${safeCanonical}" />`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<meta\b[^>]*\bname=["']description["'][^>]*>/i,
    `<meta name="description" content="${safeDescription}" />`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<meta\b[^>]*\bname=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${safeRobots}" />`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<meta\b[^>]*\bproperty=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${safeCanonical}" />`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<meta\b[^>]*\bproperty=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${safeTitle}" />`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<meta\b[^>]*\bproperty=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${safeDescription}" />`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<meta\b[^>]*\bname=["']twitter:url["'][^>]*>/i,
    `<meta name="twitter:url" content="${safeCanonical}" />`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<meta\b[^>]*\bname=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );

  output = replaceOrInsertHeadTag(
    output,
    /<meta\b[^>]*\bname=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${safeDescription}" />`
  );

  return output;
}
