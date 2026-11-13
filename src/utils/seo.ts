export const CANONICAL_BASE_URL = 'https://mishkaat-website-1.onrender.com';

export interface SeoScholarInfo {
  full_name: string;
  honorific_title?: string | null;
  slug: string;
  biography?: string | null;
  profile_image?: string | null;
}

export interface SeoArticleInfo {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
}

export interface SeoMeta {
  canonicalUrl: string;
  title: string;
  description: string;
  robots: string;
}

const VALID_TOP_ROUTES = new Set([
  'home',
  'speeches',
  'reels',
  'books',
  'articles',
  'aqwaal',
  'shayariyan',
  'contact',
  'admin'
]);

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function parseRouteFromPathname(
  pathname: string,
  hash?: string
): { route: string; param: string | null } {
  let rawPath = (pathname || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  if (!rawPath && hash) {
    rawPath = hash.replace(/^#\/?/, '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  }

  if (!rawPath) {
    return { route: 'home', param: null };
  }

  const parts = rawPath.split('/').filter(Boolean);
  const segment1 = parts[0];
  const param = parts[1] ? safeDecode(parts[1]) : null;

  if (segment1 === 'scholar') {
    return param ? { route: 'scholar', param } : { route: 'home', param: null };
  }

  if (segment1 === 'article' || segment1 === 'articles') {
    return { route: 'articles', param };
  }

  if (VALID_TOP_ROUTES.has(segment1)) {
    return { route: segment1, param };
  }

  return { route: 'home', param: null };
}

export function getPathFromRoute(route: string, param?: string | null): string {
  const cleanParam = param ? param.trim() : null;

  if (route === 'home') return '/';
  if (route === 'scholar') {
    return cleanParam ? `/scholar/${encodeURIComponent(cleanParam)}` : '/';
  }
  if (route === 'articles' || route === 'article') {
    return cleanParam ? `/articles/${encodeURIComponent(cleanParam)}` : '/articles';
  }
  if (VALID_TOP_ROUTES.has(route)) {
    return `/${route}`;
  }
  return '/';
}

function truncateClean(text: string | null | undefined, maxLen = 158): string | null {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen - 1).trimEnd()}…`;
}

export function buildRouteSeoMeta(params: {
  route: string;
  slug?: string | null;
  scholar?: SeoScholarInfo | null;
  article?: SeoArticleInfo | null;
}): SeoMeta {
  const { route, slug, scholar, article } = params;
  const normalizedPath = getPathFromRoute(route, slug);
  const canonicalUrl = `${CANONICAL_BASE_URL}${normalizedPath}`;

  const defaultRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const staticMeta: Record<string, { title: string; description: string }> = {
    home: {
      title: 'MISHKAAT — Islamic Knowledge & Media Platform',
      description:
        'Explore authentic Islamic knowledge at MISHKAAT — Ahl-e-Sunnat speeches, Islamic reels, books, articles, aqwaal, and devotional poetry. Discover valuable Islamic content and resources.'
    },
    speeches: {
      title: 'Islamic Speeches | MISHKAAT',
      description: 'Listen to Islamic speeches and beneficial lectures from Ahl-e-Sunnat scholars.'
    },
    reels: {
      title: 'Islamic Reels | MISHKAAT',
      description: 'Watch Islamic reels and short videos with meaningful Islamic reminders.'
    },
    books: {
      title: 'Islamic Books | MISHKAAT',
      description: 'Explore Islamic books on Quran, Hadees, Fiqh, Tasawwuf and more.'
    },
    articles: {
      title: 'Islamic Articles | MISHKAAT',
      description: 'Read Islamic articles, research and informative religious writings.'
    },
    aqwaal: {
      title: 'Islamic Aqwaal | MISHKAAT',
      description: 'Discover inspiring Islamic quotes and wisdom from respected scholars.'
    },
    shayariyan: {
      title: 'Islamic Shayariyan | MISHKAAT',
      description: 'Read devotional Islamic poetry and beautiful Urdu shayari.'
    },
    contact: {
      title: 'Contact Us | MISHKAAT',
      description: 'Contact the MISHKAAT team for questions, suggestions and feedback.'
    },
    scholar: {
      title: 'Islamic Scholars | MISHKAAT',
      description: 'Learn about respected Islamic scholars and their contributions.'
    },
    admin: {
      title: 'Admin Portal | MISHKAAT',
      description: 'MISHKAAT administration portal.'
    }
  };

  if (route === 'scholar' && slug) {
    if (scholar) {
      const fullName = scholar.full_name.trim();
      const honorific = scholar.honorific_title?.trim() || '';
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const hasHonorificAlready =
        honorific && norm(fullName).startsWith(norm(honorific));
      const displayTitle =
        honorific && !hasHonorificAlready ? `${honorific} ${fullName}` : fullName;
      const scholarTitle = `${displayTitle} | MISHKAAT`;
      const scholarDescription =
        truncateClean(scholar.biography) ||
        `Listen to verified speeches, Islamic reels, and learn about ${displayTitle} on MISHKAAT.`;

      return {
        canonicalUrl,
        title: scholarTitle,
        description: scholarDescription,
        robots: defaultRobots
      };
    }

    return {
      canonicalUrl,
      title: staticMeta.scholar.title,
      description: staticMeta.scholar.description,
      robots: defaultRobots
    };
  }

  if (route === 'articles' && slug) {
    if (article) {
      const articleDescription =
        truncateClean(article.excerpt) ||
        truncateClean(article.content) ||
        staticMeta.articles.description;

      return {
        canonicalUrl,
        title: `${article.title.trim()} | MISHKAAT`,
        description: articleDescription,
        robots: defaultRobots
      };
    }

    return {
      canonicalUrl,
      title: staticMeta.articles.title,
      description: staticMeta.articles.description,
      robots: defaultRobots
    };
  }

  const chosen = staticMeta[route] || staticMeta.home;

  return {
    canonicalUrl,
    title: chosen.title,
    description: chosen.description,
    robots: route === 'admin' ? 'noindex, nofollow' : defaultRobots
  };
}

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(canonicalUrl: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', canonicalUrl);
}

export function applyClientSeo(meta: SeoMeta) {
  if (typeof document === 'undefined') return;

  document.title = meta.title;
  upsertCanonicalLink(meta.canonicalUrl);
  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'robots', meta.robots);

  upsertMetaTag('property', 'og:url', meta.canonicalUrl);
  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);

  upsertMetaTag('name', 'twitter:url', meta.canonicalUrl);
  upsertMetaTag('name', 'twitter:title', meta.title);
  upsertMetaTag('name', 'twitter:description', meta.description);
}
