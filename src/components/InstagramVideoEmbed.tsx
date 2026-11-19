import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InstagramVideoEmbedProps {
  embedUrl: string;
  title?: string;
  zoomFill?: boolean;
  className?: string;
}

/**
 * Renders an Instagram Reel/Post embed in a clean dark cinema viewport,
 * dynamically cropping out Instagram's top profile header ("View profile")
 * and bottom social footer ("View more on Instagram") via Instagram's official
 * MEASURE / MOUNTED postMessage height events so only the video appears.
 */
export const InstagramVideoEmbed: React.FC<InstagramVideoEmbedProps> = ({
  embedUrl,
  title = 'Instagram Video',
  zoomFill = false,
  className = ''
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [embedHeight, setEmbedHeight] = useState<number | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(720);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset measurement when embedUrl changes
  useEffect(() => {
    setEmbedHeight(null);
    setIsLoaded(false);
  }, [embedUrl]);

  // Observe available container height for responsive cropping
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      if (el.clientHeight > 0) {
        setContainerHeight(el.clientHeight);
      }
    };

    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Listen to Instagram's official embed MEASURE / MOUNTED postMessage height
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin || !event.origin.includes('instagram.com')) return;
      if (iframeRef.current?.contentWindow && event.source !== iframeRef.current.contentWindow) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data || typeof data !== 'object') return;

        if (
          (data.type === 'MEASURE' || data.type === 'MOUNTED') &&
          typeof data.details?.height === 'number' &&
          data.details.height > 200
        ) {
          setEmbedHeight(Math.round(data.details.height));
          setIsLoaded(true);
        }
      } catch {
        // Ignore non-JSON postMessages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Instagram /embed/ layout offsets:
  // Top profile bar ("username / Original audio / View profile"): ~58px
  // Bottom bar ("View more on Instagram" + action icons + comments): ~136px
  const TOP_CROP = 58;
  const BOTTOM_CROP = 136;

  // Before MEASURE arrives, render tall enough (min 700px) so Instagram does not shrink the video
  const resolvedIframeHeight = embedHeight ?? Math.max(containerHeight + TOP_CROP + BOTTOM_CROP, 720);

  // Visible pure-video window height (clamped cleanly to container height)
  const rawVideoHeight = embedHeight
    ? Math.max(240, embedHeight - TOP_CROP - BOTTOM_CROP)
    : containerHeight;
  const visibleHeight = Math.min(containerHeight, rawVideoHeight);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${className}`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10 pointer-events-none">
          <Loader2 className="w-7 h-7 text-[#D4AF37] animate-spin" />
        </div>
      )}

      <div
        className={`relative w-full overflow-hidden bg-black transition-transform duration-200 ${
          zoomFill ? 'scale-[1.22]' : 'scale-100'
        }`}
        style={{ height: `${visibleHeight}px` }}
      >
        <iframe
          ref={iframeRef}
          key={embedUrl}
          src={embedUrl}
          title={title}
          scrolling="no"
          onLoad={() => setIsLoaded(true)}
          className="w-full border-0 bg-black block"
          style={{
            height: `${resolvedIframeHeight}px`,
            marginTop: `-${TOP_CROP}px`
          }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
};
