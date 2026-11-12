import { db } from './db';

const CANONICAL_BASE_URL = 'https://mishkaat-website-1.onrender.com';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const match = String(dateStr).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {}
  return new Date().toISOString().split('T')[0];
}

interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * Dynamically generates a valid XML sitemap based on:
 * 1. Static high-value routes
 * 2. Published articles from database (/articles/:slug)
 * 3. Published scholar profiles from database (/scholar/:slug)
 */
export function generateSitemapXml(): string {
  const seenUrls = new Set<string>();
  const entries: SitemapUrlEntry[] = [];

  const addUrl = (entry: SitemapUrlEntry) => {
    if (seenUrls.has(entry.loc)) return;
    seenUrls.add(entry.loc);
    entries.push(entry);
  };

  const today = new Date().toISOString().split('T')[0];

  // A. Static pages
  const staticPages: { path: string; priority: string; changefreq: string }[] = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/speeches', priority: '0.9', changefreq: 'daily' },
    { path: '/reels', priority: '0.9', changefreq: 'daily' },
    { path: '/books', priority: '0.9', changefreq: 'weekly' },
    { path: '/articles', priority: '0.9', changefreq: 'daily' },
    { path: '/aqwaal', priority: '0.8', changefreq: 'weekly' },
    { path: '/shayariyan', priority: '0.8', changefreq: 'weekly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' }
  ];

  for (const p of staticPages) {
    addUrl({
      loc: `${CANONICAL_BASE_URL}${p.path}`,
      lastmod: today,
      changefreq: p.changefreq,
      priority: p.priority
    });
  }

  // B. Published Articles
  try {
    const articles = db.prepare(`
      SELECT slug, updated_at, created_at, publication_date
      FROM articles
      WHERE is_published = 1 AND slug IS NOT NULL AND TRIM(slug) != ''
      ORDER BY publication_date DESC, created_at DESC
    `).all() as { slug: string; updated_at?: string; created_at?: string; publication_date?: string }[];

    for (const a of articles) {
      const cleanSlug = encodeURIComponent(a.slug.trim());
      addUrl({
        loc: `${CANONICAL_BASE_URL}/articles/${cleanSlug}`,
        lastmod: formatDate(a.updated_at || a.publication_date || a.created_at),
        changefreq: 'weekly',
        priority: '0.8'
      });
    }
  } catch (err) {
    console.error('[Sitemap] Error fetching articles from database:', err);
  }

  // C. Published Scholars
  try {
    const scholars = db.prepare(`
      SELECT slug, updated_at, created_at
      FROM scholars
      WHERE is_published = 1 AND slug IS NOT NULL AND TRIM(slug) != ''
      ORDER BY created_at ASC
    `).all() as { slug: string; updated_at?: string; created_at?: string }[];

    for (const s of scholars) {
      const cleanSlug = encodeURIComponent(s.slug.trim());
      addUrl({
        loc: `${CANONICAL_BASE_URL}/scholar/${cleanSlug}`,
        lastmod: formatDate(s.updated_at || s.created_at),
        changefreq: 'weekly',
        priority: '0.8'
      });
    }
  } catch (err) {
    console.error('[Sitemap] Error fetching scholars from database:', err);
  }

  // Generate standard sitemap 0.9 XML protocol
  const urlNodes = entries
    .map((entry) => {
      let xml = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n`;
      if (entry.lastmod) {
        xml += `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n`;
      }
      if (entry.changefreq) {
        xml += `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>\n`;
      }
      if (entry.priority) {
        xml += `    <priority>${escapeXml(entry.priority)}</priority>\n`;
      }
      xml += `  </url>`;
      return xml;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>`;
}
