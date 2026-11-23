export interface ResolvedInstagramMedia {
  shortcode: string;
  mediaType: 'reel' | 'p' | 'tv';
  videoUrl: string | null;
  posterUrl: string | null;
  embedUrl: string;
  canonicalUrl: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 25 * 60 * 1000; // 25 minutes for resolved streams
const NEGATIVE_CACHE_TTL_MS = 30 * 1000; // 30 seconds max if extraction failed
const cache = new Map<string, ResolvedInstagramMedia>();

const DESKTOP_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Dest': 'document'
};

const BOT_PREVIEW_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

export function parseInstagramShortcode(
  rawUrl: string
): { type: 'reel' | 'p' | 'tv'; code: string } | null {
  if (!rawUrl) return null;
  const clean = rawUrl.trim();
  const match = clean.match(
    /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:[A-Za-z0-9._]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i
  );
  if (!match || !match[1] || !match[2]) return null;
  const rawType = match[1].toLowerCase();
  const type: 'reel' | 'p' | 'tv' =
    rawType === 'reels' ? 'reel' : (rawType as 'reel' | 'p' | 'tv');
  return { type, code: match[2] };
}

function safeUnescapeJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw.replace(/\\?"/g, '\\"')}"`);
  } catch {
    return raw
      .replace(/\\\//g, '/')
      .replace(/\\u0026/g, '&')
      .replace(/\\u0025/g, '%')
      .replace(/&amp;/g, '&');
  }
}

function safeUnescapeHtmlAttr(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractMetaContent(html: string, propertyNames: string[]): string | null {
  for (const prop of propertyNames) {
    const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m1 = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i')
    );
    if (m1 && m1[1]) return safeUnescapeHtmlAttr(m1[1]);

    const m2 = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i')
    );
    if (m2 && m2[1]) return safeUnescapeHtmlAttr(m2[1]);
  }
  return null;
}

function extractMediaFromHtml(html: string): { videoUrl: string | null; posterUrl: string | null } {
  let videoUrl: string | null = null;
  let posterUrl: string | null = null;

  // 1. Progressive video_versions array (preferred: muxed video + audio)
  const vvMatch = html.match(/"video_versions"\s*:\s*(\[[^\]]+\])/);
  if (vvMatch && vvMatch[1]) {
    try {
      const versions = JSON.parse(vvMatch[1]) as Array<{ type?: number; url?: string }>;
      const progressive =
        versions.find((v) => v.type === 101 && typeof v.url === 'string' && v.url.startsWith('http')) ||
        versions.find((v) => typeof v.url === 'string' && v.url.startsWith('http'));
      if (progressive?.url) {
        videoUrl = progressive.url;
      }
    } catch {
      // Fall through to regex extraction
    }
  }

  // 2. Direct "video_url" JSON property (often found in /embed/captioned/ or GraphQL payloads)
  if (!videoUrl) {
    const vuMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (vuMatch && vuMatch[1]) {
      const candidate = safeUnescapeJsonString(vuMatch[1]);
      if (candidate.startsWith('http')) {
        videoUrl = candidate;
      }
    }
  }

  // 3. Fallback: scan for direct progressive CDN .mp4 links in HTML
  if (!videoUrl) {
    const mp4Matches = html.match(/https?:(?:\\\/|\/)+scontent[^"'\s<>]+\.mp4[^"'\s<>]*/gi) || [];
    for (const raw of mp4Matches) {
      const candidate = safeUnescapeJsonString(raw);
      if (candidate.startsWith('http')) {
        videoUrl = candidate;
        break;
      }
    }
  }

  // Extract poster / thumbnail URL
  const displayUriMatch =
    html.match(/"display_uri"\s*:\s*"([^"]+)"/) ||
    html.match(/"thumbnail_src"\s*:\s*"([^"]+)"/) ||
    html.match(/"display_url"\s*:\s*"([^"]+)"/);
  if (displayUriMatch && displayUriMatch[1]) {
    const candidate = safeUnescapeJsonString(displayUriMatch[1]);
    if (candidate.startsWith('http')) {
      posterUrl = candidate;
    }
  }

  if (!posterUrl) {
    posterUrl = extractMetaContent(html, ['og:image', 'twitter:image']);
  }

  if (!posterUrl) {
    const embeddedImgMatch = html.match(
      /<img[^>]+class=["'][^"']*EmbeddedMediaImage[^"']*["'][^>]+src=["']([^"']+)["']/i
    );
    if (embeddedImgMatch && embeddedImgMatch[1]) {
      posterUrl = safeUnescapeHtmlAttr(embeddedImgMatch[1]);
    }
  }

  return { videoUrl, posterUrl };
}

async function verifyVideoStreamUrl(candidateUrl: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'User-Agent': DESKTOP_HEADERS['User-Agent'],
      Range: 'bytes=0-1'
    };
    if (/instagram\.com|cdninstagram\.com|fbcdn\.net/i.test(candidateUrl)) {
      headers['Referer'] = 'https://www.instagram.com/';
    }
    const res = await fetch(candidateUrl, {
      method: 'GET',
      redirect: 'follow',
      headers,
      signal: AbortSignal.timeout(6000)
    });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    // Drain body cleanly so socket closes
    try {
      await res.body?.cancel();
    } catch {}
    const looksLikeVideo =
      ct.startsWith('video/') ||
      ct.includes('mp4') ||
      (ct.includes('octet-stream') && /\.(mp4|m4v|mov)(\?|$)/i.test(res.url || candidateUrl));
    return (res.ok || res.status === 206) && looksLikeVideo;
  } catch {
    return false;
  }
}

async function resolveViaOpenProxy(
  host: string,
  type: 'reel' | 'p' | 'tv',
  code: string
): Promise<{ videoUrl: string | null; posterUrl: string | null }> {
  try {
    const url = `https://${host}/${type}/${code}/`;
    const res = await fetch(url, {
      headers: BOT_PREVIEW_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(7000)
    });
    if (!res.ok) return { videoUrl: null, posterUrl: null };
    const html = await res.text();

    let candidateVideo = extractMetaContent(html, ['og:video:secure_url', 'og:video:url', 'og:video']);
    if (!candidateVideo) {
      const sourceMatch = html.match(/<(?:video|source)[^>]+src=["']([^"']+)["']/i);
      if (sourceMatch && sourceMatch[1]) {
        candidateVideo = safeUnescapeHtmlAttr(sourceMatch[1]);
      }
    }

    if (candidateVideo) {
      if (candidateVideo.startsWith('/')) {
        candidateVideo = `https://${host}${candidateVideo}`;
      }
      if (candidateVideo.startsWith('http') && (await verifyVideoStreamUrl(candidateVideo))) {
        const poster = extractMetaContent(html, ['og:image', 'twitter:image']);
        return {
          videoUrl: candidateVideo,
          posterUrl: poster && poster.startsWith('/') ? `https://${host}${poster}` : poster
        };
      }
    }

    const poster = extractMetaContent(html, ['og:image', 'twitter:image']);
    return {
      videoUrl: null,
      posterUrl: poster && poster.startsWith('/') ? `https://${host}${poster}` : poster
    };
  } catch {
    return { videoUrl: null, posterUrl: null };
  }
}

async function resolveShareRedirect(inputUrl: string): Promise<{ type: 'reel' | 'p' | 'tv'; code: string } | null> {
  try {
    const parsed = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
    if (!/instagram\.com$|instagr\.am$/i.test(parsed.hostname.replace(/^www\./, ''))) {
      return null;
    }
    const res = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: DESKTOP_HEADERS,
      signal: AbortSignal.timeout(7000)
    });
    const fromFinalUrl = parseInstagramShortcode(res.url);
    if (fromFinalUrl) return fromFinalUrl;

    const html = await res.text();
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    if (canonicalMatch && canonicalMatch[1]) {
      return parseInstagramShortcode(canonicalMatch[1]);
    }
  } catch {
    // Ignore redirect resolution failure
  }
  return null;
}

export async function resolveInstagramMedia(
  inputUrl: string,
  forceRefresh = false
): Promise<ResolvedInstagramMedia | null> {
  const cleanInput = (inputUrl || '').trim();
  if (!cleanInput) return null;

  let parsed = parseInstagramShortcode(cleanInput);
  if (!parsed && /instagram\.com\/share\//i.test(cleanInput)) {
    parsed = await resolveShareRedirect(cleanInput);
  }
  if (!parsed) return null;

  const { type, code } = parsed;
  const cacheKey = code;
  const now = Date.now();

  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached;
    }
  }

  const embedUrl = `https://www.instagram.com/${type}/${code}/embed/`;
  const canonicalUrl = `https://www.instagram.com/${type}/${code}/`;
  let videoUrl: string | null = null;
  let posterUrl: string | null = null;

  // Layer 1: Direct Instagram /p/{code}/ HTML (works on non-datacenter IPs & also captures og:image poster)
  try {
    const res = await fetch(`https://www.instagram.com/p/${code}/`, {
      headers: DESKTOP_HEADERS,
      signal: AbortSignal.timeout(5500)
    });
    if (res.ok) {
      const html = await res.text();
      const extracted = extractMediaFromHtml(html);
      if (extracted.posterUrl) posterUrl = extracted.posterUrl;
      if (extracted.videoUrl) videoUrl = extracted.videoUrl;
    }
  } catch {
    // Fall through to Layer 2
  }

  // Layer 2: Open embed relays (vxinstagram, uuinstagram, kkinstagram, ddinstagram)
  const relayHosts = ['vxinstagram.com', 'uuinstagram.com', 'kkinstagram.com', 'ddinstagram.com'];
  for (const host of relayHosts) {
    if (videoUrl) break;
    const relay = await resolveViaOpenProxy(host, type, code);
    if (!posterUrl && relay.posterUrl) posterUrl = relay.posterUrl;
    if (relay.videoUrl) videoUrl = relay.videoUrl;
  }

  // Layer 3: Instagram /embed/captioned/ HTML fallback
  if (!videoUrl) {
    try {
      const res = await fetch(`https://www.instagram.com/${type}/${code}/embed/captioned/`, {
        headers: DESKTOP_HEADERS,
        signal: AbortSignal.timeout(5500)
      });
      if (res.ok) {
        const html = await res.text();
        const extracted = extractMediaFromHtml(html);
        if (!posterUrl && extracted.posterUrl) posterUrl = extracted.posterUrl;
        if (extracted.videoUrl) videoUrl = extracted.videoUrl;
      }
    } catch {
      // Ignore
    }
  }

  const resolved: ResolvedInstagramMedia = {
    shortcode: code,
    mediaType: type,
    videoUrl,
    posterUrl,
    embedUrl,
    canonicalUrl,
    expiresAt: now + (videoUrl ? CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS)
  };

  cache.set(cacheKey, resolved);
  return resolved;
}

export function invalidateInstagramCache(inputUrl: string): void {
  const parsed = parseInstagramShortcode(inputUrl);
  if (parsed) {
    cache.delete(parsed.code);
  }
}
