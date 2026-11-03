// Utility helpers for media, video URLs, and YouTube thumbnail extraction

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Standard regex for all YouTube variants (regular watch, short URL, shorts, embed, live)
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = cleanUrl.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // Robust string-based fallbacks:
  if (cleanUrl.includes('youtu.be/')) {
    const after = cleanUrl.split('youtu.be/')[1];
    return after ? after.split(/[?#&]/)[0] : null;
  }
  if (cleanUrl.includes('shorts/')) {
    const after = cleanUrl.split('shorts/')[1];
    return after ? after.split(/[?#&]/)[0] : null;
  }
  if (cleanUrl.includes('embed/')) {
    const after = cleanUrl.split('embed/')[1];
    return after ? after.split(/[?#&]/)[0] : null;
  }
  if (cleanUrl.includes('live/')) {
    const after = cleanUrl.split('live/')[1];
    return after ? after.split(/[?#&]/)[0] : null;
  }
  if (cleanUrl.includes('v=')) {
    const after = cleanUrl.split('v=')[1];
    return after ? after.split('&')[0].split('#')[0] : null;
  }
  return null;
}

export function extractYouTubeThumbnail(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function isVideoMedia(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    /\.(mp4|webm|mov|m4v|mkv|ogg)($|\?)/i.test(url)
  );
}

export function resolveMediaThumbnail(thumbnail: string | null | undefined, mediaUrl: string | null | undefined): string {
  if (thumbnail && !thumbnail.includes('google.com/imgres') && !thumbnail.includes('google.com/url') && thumbnail.trim()) {
    return thumbnail;
  }
  const yt = extractYouTubeThumbnail(mediaUrl);
  if (yt) return yt;
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
}
