import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  User,
  ExternalLink,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  RotateCw,
  Gauge,
  Download
} from 'lucide-react';
import { Reel } from '../types';
import { api } from '../services/api';
import { useUserAuth } from '../context/UserAuthContext';
import { useAuth } from '../context/AuthContext';
import { CommentsSection } from './CommentsSection';
import { ShareModal } from './ShareModal';
import { extractYouTubeId, isInstagramUrl, getInstagramEmbedUrl } from '../utils/media';

interface ReelPlayerModalProps {
  reel: Reel | null;
  reels?: Reel[];
  onSelectReel?: (reel: Reel) => void;
  onClose: () => void;
  onNavigateScholar?: (slug: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const ReelPlayerModal: React.FC<ReelPlayerModalProps> = ({
  reel: initialReel,
  reels = [],
  onSelectReel,
  onClose,
  onNavigateScholar,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}) => {
  const { user, isBookmarked, toggleBookmark, openAuthModal } = useUserAuth();
  const { admin } = useAuth();
  const effectiveUser = user || (admin ? { id: admin.id, full_name: admin.full_name || 'Admin' } : null);

  // Active reel state
  const [currentReel, setCurrentReel] = useState<Reel | null>(initialReel);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Social interactions state
  const [likesCount, setLikesCount] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFitMode, setIsFitMode] = useState(false); // Toggle between full bleed and complete uncropped fit

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const youTubeTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);

  // Send control commands to YouTube iframe via postMessage API
  const sendYouTubeCommand = useCallback((func: string, args: any[] = []) => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      }
    } catch (e) {
      console.warn('YouTube postMessage error in Reel:', e);
    }
  }, []);

  // Listen to YouTube playback events to track current playhead position
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined) {
          youTubeTimeRef.current = Number(data.info.currentTime) || 0;
        }
      } catch (_) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sync initial reel unconditionally so close/unmount works immediately
  useEffect(() => {
    setCurrentReel(initialReel);
    if (initialReel) {
      setIsCommentsOpen(false);
      setShowSpeedMenu(false);
      setPlaybackSpeed(1);
    }
  }, [initialReel]);

  const handleClose = () => {
    setCurrentReel(null);
    onClose();
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    sendYouTubeCommand('setPlaybackRate', [speed]);
    setShowSpeedMenu(false);
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    } else if (iframeRef.current) {
      const targetTime = Math.max(0, youTubeTimeRef.current + seconds);
      youTubeTimeRef.current = targetTime;
      sendYouTubeCommand('seekTo', [targetTime, true]);
    }
  };

  // Load interactions (likes & comments) whenever active reel changes
  const loadInteractions = useCallback(async (reelId: string) => {
    try {
      const data = await api.getInteractions('reel', reelId);
      setLikesCount(data.likes_count || 0);
      setHasLiked(!!data.has_liked);
      setComments(data.comments || []);
    } catch (err) {
      console.warn('Could not load reel interactions:', err);
    }
  }, []);

  useEffect(() => {
    if (currentReel) {
      setIsPlaying(true);
      loadInteractions(currentReel.id);
    }
  }, [currentReel?.id, loadInteractions]);

  // Determine current index and next/prev availability
  const currentIndex = currentReel && reels.length > 0 ? reels.findIndex((r) => r.id === currentReel.id) : -1;
  const canGoNext = hasNext ?? (currentIndex >= 0 && currentIndex < reels.length - 1);
  const canGoPrev = hasPrev ?? (currentIndex > 0);

  const goToNextReel = useCallback(() => {
    if (isTransitioning) return;
    if (currentIndex >= 0 && currentIndex < reels.length - 1) {
      setIsTransitioning(true);
      const nextR = reels[currentIndex + 1];
      setCurrentReel(nextR);
      if (onSelectReel) onSelectReel(nextR);
      setTimeout(() => setIsTransitioning(false), 300);
    } else if (onNext) {
      onNext();
    }
  }, [currentIndex, reels, onSelectReel, onNext, isTransitioning]);

  const goToPrevReel = useCallback(() => {
    if (isTransitioning) return;
    if (currentIndex > 0) {
      setIsTransitioning(true);
      const prevR = reels[currentIndex - 1];
      setCurrentReel(prevR);
      if (onSelectReel) onSelectReel(prevR);
      setTimeout(() => setIsTransitioning(false), 300);
    } else if (onPrev) {
      onPrev();
    }
  }, [currentIndex, reels, onSelectReel, onPrev, isTransitioning]);

  // Mouse wheel scroll navigation (YouTube Shorts style: scroll down -> next, scroll up -> prev)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // If user is scrolling inside comments, don't hijack reel change
      if (isCommentsOpen) return;

      const now = Date.now();
      if (now - lastScrollTime.current < 450) return;

      if (e.deltaY > 35) {
        lastScrollTime.current = now;
        goToNextReel();
      } else if (e.deltaY < -35) {
        lastScrollTime.current = now;
        goToPrevReel();
      }
    },
    [goToNextReel, goToPrevReel, isCommentsOpen]
  );

  // Touch swipe navigation for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isCommentsOpen) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      // Swiped up -> next reel
      goToNextReel();
    } else if (diff < -50) {
      // Swiped down -> prev reel
      goToPrevReel();
    }
  };

  // Keyboard navigation (ArrowDown / ArrowUp)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCommentsOpen) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrevReel();
      } else      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextReel, goToPrevReel, onClose, isCommentsOpen]);

  if (!initialReel || !currentReel) return null;

  const isYouTube = currentReel.video_url.includes('youtube.com') || currentReel.video_url.includes('youtu.be');
  const isInstagram = !isYouTube && isInstagramUrl(currentReel.video_url);
  const instagramEmbedUrl = isInstagram ? getInstagramEmbedUrl(currentReel.video_url) : null;

  const getYouTubeEmbed = (url: string) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&loop=1&playsinline=1&controls=1&modestbranding=1&rel=0`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  // Like handler
  const handleLike = async () => {
    if (!effectiveUser) {
      openAuthModal('signin');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic update
    const prevLiked = hasLiked;
    const prevCount = likesCount;
    setHasLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.toggleLike('reel', currentReel.id);
      setHasLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch (err) {
      // Revert on error
      setHasLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  // Bookmark / Save handler
  const isSaved = isBookmarked('reel', currentReel.id);
  const handleSave = async () => {
    if (!effectiveUser) {
      openAuthModal('signin');
      return;
    }
    await toggleBookmark('reel', currentReel.id);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Floating prominent Close / Wapas button with top z-index */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="fixed top-4 right-4 z-[9999] bg-stone-900/95 hover:bg-rose-700 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-2xl border border-white/20 cursor-pointer transition-all active:scale-95"
        title="Wapas / Close (Home)"
      >
        <X className="w-4 h-4 text-[#D4AF37]" />
        <span>✕ Wapas / Close</span>
      </button>

      {/* Outer wrapper with YouTube Shorts vertical container */}
      <div
        ref={containerRef}
        className="relative bg-[#101510] text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center w-full max-w-[460px] sm:max-w-[500px] h-[92vh] max-h-[840px] border border-white/10 select-none"
      >
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider truncate">
              Mishkaat Shorts
            </span>
          </div>

          <div className="flex items-center gap-1.5 relative">
            {/* Fit / Crop Mode Toggle (only for native video) */}
            {!isYouTube && !isInstagram && (
              <button
                type="button"
                onClick={() => setIsFitMode(!isFitMode)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                  isFitMode
                    ? 'bg-[#064E3B] text-white border-emerald-500'
                    : 'bg-black/50 hover:bg-black/70 text-stone-300 border-white/15'
                }`}
                title={isFitMode ? 'Fit View (No video cutoff)' : 'Full Fill (Cropped)'}
              >
                {isFitMode ? 'Fit 📐' : 'Fill 🔲'}
              </button>
            )}

            {/* Speed Selector Toggle (native video & YouTube) */}
            {!isInstagram && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2 py-1 rounded-md bg-black/50 hover:bg-black/70 text-[11px] font-bold text-[#D4AF37] border border-white/15 transition-colors cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute top-8 right-0 bg-stone-900 border border-white/20 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-40 min-w-[70px]">
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded text-left transition-colors cursor-pointer ${
                          playbackSpeed === spd ? 'bg-[#064E3B] text-white font-bold' : 'text-stone-300 hover:bg-white/10'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Open on Instagram fallback link */}
            {isInstagram && currentReel.video_url && (
              <a
                href={currentReel.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-amber-500 hover:opacity-90 text-white text-[11px] font-bold flex items-center gap-1 transition-opacity cursor-pointer shadow-xs"
                title="Open Original on Instagram"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Instagram</span>
              </a>
            )}

            {/* Direct Download Button (only for direct video files) */}
            {!isYouTube && !isInstagram && currentReel.video_url && (
              <a
                href={currentReel.video_url}
                download
                className="p-1.5 rounded-full bg-black/40 hover:bg-[#D4AF37] hover:text-stone-950 text-white transition-colors cursor-pointer"
                title="Download Reel Video"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            )}

            {!isYouTube && !isInstagram && (
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={toggleFullScreen}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              aria-label="Close reel"
              title="Close reel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {/* On-screen Rewind -10s and Forward +10s controls (for native video & YouTube links) */}
          {!isInstagram && (
            <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none z-20">
              <button
                type="button"
                onClick={() => skipTime(-10)}
                className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-xs transition-all pointer-events-auto cursor-pointer hover:scale-110 active:scale-95 flex flex-col items-center border border-white/20 shadow-lg"
                title="Rewind 10 seconds (-10s)"
              >
                <RotateCcw className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[9px] font-mono font-bold mt-0.5">-10s</span>
              </button>

              <button
                type="button"
                onClick={() => skipTime(10)}
                className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-xs transition-all pointer-events-auto cursor-pointer hover:scale-110 active:scale-95 flex flex-col items-center border border-white/20 shadow-lg"
                title="Fast forward 10 seconds (+10s)"
              >
                <RotateCw className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[9px] font-mono font-bold mt-0.5">+10s</span>
              </button>
            </div>
          )}

          {isYouTube ? (
            <iframe
              ref={iframeRef}
              key={currentReel.id}
              src={getYouTubeEmbed(currentReel.video_url) || ''}
              title={currentReel.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                sendYouTubeCommand('listening');
              }}
            />
          ) : isInstagram ? (
            instagramEmbedUrl ? (
              <div className="w-full h-full bg-white flex items-center justify-center pt-10 pb-24">
                <iframe
                  key={currentReel.id}
                  src={instagramEmbedUrl}
                  title={currentReel.title || 'Instagram Reel'}
                  className="w-full h-full border-0 bg-white"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-6 text-center space-y-3">
                <Play className="w-10 h-10 text-[#D4AF37] mx-auto" />
                <p className="text-xs text-stone-300">Open this Instagram Reel directly in Instagram</p>
                <a
                  href={currentReel.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-amber-500 text-white text-xs font-bold"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Watch on Instagram ↗</span>
                </a>
              </div>
            )
          ) : (
            <video
              key={currentReel.id}
              ref={videoRef}
              src={currentReel.video_url}
              poster={currentReel.thumbnail || undefined}
              loop
              autoPlay
              playsInline
              onClick={togglePlay}
              className={`w-full h-full ${
                isFitMode ? 'object-contain bg-black' : 'object-cover'
              } cursor-pointer transition-opacity duration-200 ${
                isTransitioning ? 'opacity-40' : 'opacity-100'
              }`}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}

          {/* Central Play/Pause Flash Overlay */}
          {!isYouTube && !isInstagram && !isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white pointer-events-auto cursor-pointer border border-white/20"
            >
              <Play className="w-8 h-8 ml-1 text-white fill-white" />
            </button>
          )}

          {/* Bottom Information Overlay with Gradient Scrim */}
          <div className="absolute bottom-0 left-0 right-14 z-20 p-4 pt-14 bg-gradient-to-t from-black/95 via-black/60 to-transparent space-y-1.5 pointer-events-auto">
            {/* Scholar Link */}
            {currentReel.scholar_name && (
              <div className="flex items-center gap-2">
                {currentReel.scholar_slug && onNavigateScholar ? (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateScholar(currentReel.scholar_slug!);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline cursor-pointer group"
                  >
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="truncate max-w-[200px]">
                      {currentReel.scholar_title ? `${currentReel.scholar_title} ` : ''}
                      {currentReel.scholar_name}
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37]">
                    <User className="w-3.5 h-3.5" />
                    <span>{currentReel.scholar_name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Reel Title */}
            <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-sm">
              {currentReel.title}
            </h4>

            {/* Optional Description */}
            {currentReel.description && (
              <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed">
                {currentReel.description}
              </p>
            )}

            {/* Powered By Watermark */}
            <p className="text-[9px] text-[#D4AF37]/70 font-mono tracking-wider pt-0.5">
              POWERED BY SYED ALI QALANDAR PEERZADE
            </p>
          </div>

          {/* RIGHT-SIDE ACTION RAIL (YouTube Shorts style: Like, Comments, Save, Share) */}
          <div className="absolute right-2.5 bottom-16 z-30 flex flex-col items-center gap-4 pointer-events-auto">
            {/* Scholar Avatar Circle if available */}
            {currentReel.scholar_slug && onNavigateScholar && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateScholar(currentReel.scholar_slug!);
                }}
                className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-stone-900 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                title="View Scholar Profile"
              >
                {currentReel.scholar_image ? (
                  <img
                    src={currentReel.scholar_image}
                    alt={currentReel.scholar_name || 'Scholar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D4AF37]">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </button>
            )}

            {/* LIKE BUTTON */}
            <button
              onClick={handleLike}
              className="flex flex-col items-center group cursor-pointer focus:outline-none"
              title={hasLiked ? 'Unlike' : 'Like'}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                  hasLiked
                    ? 'bg-rose-600/90 text-white scale-110 shadow-lg shadow-rose-600/40'
                    : 'bg-black/50 text-white hover:bg-black/70 hover:scale-105'
                }`}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-white text-white' : 'text-white'}`} />
              </div>
              <span className="text-[11px] font-bold mt-1 text-white drop-shadow-sm font-mono">
                {likesCount}
              </span>
            </button>

            {/* COMMENT BUTTON */}
            <button
              onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              className="flex flex-col items-center group cursor-pointer focus:outline-none"
              title="Comments & Reflections"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                  isCommentsOpen
                    ? 'bg-[#D4AF37] text-stone-950 scale-105 shadow-md'
                    : 'bg-black/50 text-white hover:bg-black/70 hover:scale-105'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold mt-1 text-white drop-shadow-sm font-mono">
                {comments.length}
              </span>
            </button>

            {/* SAVE (BOOKMARK) BUTTON */}
            <button
              onClick={handleSave}
              className="flex flex-col items-center group cursor-pointer focus:outline-none"
              title={isSaved ? 'Saved to Bookmarks' : 'Save to Bookmarks'}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                  isSaved
                    ? 'bg-[#D4AF37] text-stone-950 scale-110 shadow-lg shadow-[#D4AF37]/30'
                    : 'bg-black/50 text-white hover:bg-black/70 hover:scale-105'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-stone-950 text-stone-950' : 'text-white'}`} />
              </div>
              <span className="text-[10px] font-medium mt-1 text-white drop-shadow-sm">
                {isSaved ? 'Saved' : 'Save'}
              </span>
            </button>

            {/* SHARE BUTTON */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex flex-col items-center group cursor-pointer focus:outline-none"
              title="Share Reel"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-black/50 text-white hover:bg-black/70 hover:scale-105 backdrop-blur-md transition-all">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium mt-1 text-white drop-shadow-sm">
                Share
              </span>
            </button>
          </div>
        </div>

        {/* Slide-over Comments Sheet */}
        {isCommentsOpen && (
          <CommentsSection
            itemType="reel"
            itemId={currentReel.id}
            itemTitle={currentReel.title}
            comments={comments}
            isOverlay={true}
            onClose={() => setIsCommentsOpen(false)}
            onCommentAdded={(newComment) => {
              setComments((prev) => [newComment, ...prev]);
            }}
            onCommentDeleted={(deletedId) => {
              setComments((prev) => prev.filter((c) => c.id !== deletedId));
            }}
          />
        )}

        {/* Up / Down navigation floating arrows (visible on desktop) */}
        {canGoPrev && (
          <button
            onClick={goToPrevReel}
            className="hidden sm:flex absolute -left-12 top-[45%] -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white items-center justify-center transition-all cursor-pointer shadow-lg"
            title="Previous Reel (or scroll up)"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        )}
        {canGoNext && (
          <button
            onClick={goToNextReel}
            className="hidden sm:flex absolute -left-12 top-[55%] -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white items-center justify-center transition-all cursor-pointer shadow-lg"
            title="Next Reel (or scroll down)"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={currentReel.title}
        category="Islamic Reel"
      />
    </div>
  );
};
