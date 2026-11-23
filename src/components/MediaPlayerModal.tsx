import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Volume2,
  Calendar,
  Clock,
  User,
  Tag,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  RotateCcw,
  RotateCw,
  Download,
  Gauge,
  ExternalLink,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Speech, ActivityTabType } from '../types';
import { api } from '../services/api';
import { useUserAuth } from '../context/UserAuthContext';
import { useAuth } from '../context/AuthContext';
import { CommentsSection } from './CommentsSection';
import { ShareModal } from './ShareModal';
import { InstagramVideoEmbed } from './InstagramVideoEmbed';
import {
  EngagementActivityModal,
  StatActivityButton,
  invalidateActivityCache
} from './EngagementActivityModal';
import {
  extractYouTubeId,
  resolveMediaThumbnail,
  isVideoMedia,
  isInstagramUrl,
  getInstagramEmbedUrl,
  getInstagramStreamUrl,
  getInstagramThumbUrl
} from '../utils/media';

interface MediaPlayerModalProps {
  speech: Speech | null;
  onClose: () => void;
  onNavigateScholar?: (slug: string) => void;
  onSpeechStatsUpdated?: (speechId: string, patch: Partial<Speech>) => void;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  speech,
  onClose,
  onNavigateScholar,
  onSpeechStatsUpdated
}) => {
  const { user, isBookmarked, toggleBookmark, openAuthModal } = useUserAuth();
  const { admin } = useAuth();
  const effectiveUser = user || (admin ? { id: admin.id, full_name: admin.full_name || 'Admin' } : null);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Social interactions state
  const [viewsCount, setViewsCount] = useState<number>(speech?.views_count ?? 0);
  const [likesCount, setLikesCount] = useState<number>(speech?.likes_count ?? 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [sharesCount, setSharesCount] = useState<number>(speech?.shares_count ?? 0);
  const [savesCount, setSavesCount] = useState<number>(speech?.saves_count ?? 0);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [igStreamFailed, setIgStreamFailed] = useState(false);
  const [igRetryCount, setIgRetryCount] = useState(0);
  const [igRetryNonce, setIgRetryNonce] = useState(0);
  const [activityModalTab, setActivityModalTab] = useState<ActivityTabType | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const youTubeTimeRef = useRef<number>(0);
  const commentsRef = useRef<HTMLDivElement | null>(null);

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
      console.warn('YouTube postMessage error:', e);
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

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    if (audioRef.current) audioRef.current.playbackRate = speed;
    sendYouTubeCommand('setPlaybackRate', [speed]);
  };

  const skipMedia = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    } else if (iframeRef.current) {
      const targetTime = Math.max(0, youTubeTimeRef.current + seconds);
      youTubeTimeRef.current = targetTime;
      sendYouTubeCommand('seekTo', [targetTime, true]);
    }
  };

  // Load interactions when speech or signed-in user opens/changes
  const loadInteractions = useCallback(async (speechId: string) => {
    if (!speechId) return;
    try {
      const data = await api.getInteractions('speech', speechId);
      setLikesCount(data.likes_count || 0);
      setHasLiked(!!data.has_liked);
      setSharesCount(data.shares_count ?? 0);
      setSavesCount(data.saves_count ?? 0);
      if (typeof data.views_count === 'number') {
        setViewsCount(data.views_count);
      }
      setComments(data.comments || []);
      onSpeechStatsUpdated?.(speechId, {
        likes_count: data.likes_count || 0,
        shares_count: data.shares_count ?? 0,
        saves_count: data.saves_count ?? 0,
        comments_count: (data.comments || []).length,
        ...(typeof data.views_count === 'number' ? { views_count: data.views_count } : {})
      });
    } catch (err) {
      console.warn('Could not load speech interactions:', err);
    }
  }, [onSpeechStatsUpdated]);

  useEffect(() => {
    setIgStreamFailed(false);
    setIgRetryCount(0);
    setIgRetryNonce(0);
    setActivityModalTab(null);
    if (speech && speech.id) {
      setViewsCount(speech.views_count ?? 0);
      setLikesCount(speech.likes_count ?? 0);
      setSharesCount(speech.shares_count ?? 0);
      setSavesCount(speech.saves_count ?? 0);
      loadInteractions(speech.id);

      const viewerIdentity = user?.id ? `u_${user.id}` : admin?.id ? `a_${admin.id}` : 'guest';
      const viewKey = `${viewerIdentity}:${speech.id}`;
      try {
        const raw = localStorage.getItem('mishkaat_viewed_speeches_map');
        const viewedMap: Record<string, boolean> = raw ? JSON.parse(raw) : {};
        if (!viewedMap[viewKey]) {
          viewedMap[viewKey] = true;
          localStorage.setItem('mishkaat_viewed_speeches_map', JSON.stringify(viewedMap));
          api.incrementSpeechView(speech.id)
            .then((res) => {
              invalidateActivityCache('speech', speech.id);
              setViewsCount(res.views_count);
              onSpeechStatsUpdated?.(speech.id, { views_count: res.views_count });
            })
            .catch(() => {
              try {
                const curr = localStorage.getItem('mishkaat_viewed_speeches_map');
                const parsed: Record<string, boolean> = curr ? JSON.parse(curr) : {};
                delete parsed[viewKey];
                localStorage.setItem('mishkaat_viewed_speeches_map', JSON.stringify(parsed));
              } catch {}
            });
        }
      } catch {
        api.incrementSpeechView(speech.id)
          .then((res) => {
            invalidateActivityCache('speech', speech.id);
            setViewsCount(res.views_count);
            onSpeechStatsUpdated?.(speech.id, { views_count: res.views_count });
          })
          .catch(() => {});
      }
    }
  }, [speech?.id, effectiveUser?.id, loadInteractions, onSpeechStatsUpdated]);

  if (!speech) return null;

  const mediaUrl = speech.media_url || '';
  const youtubeId = extractYouTubeId(mediaUrl);
  const isYouTube = !!youtubeId || mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be');
  const isInstagram = !isYouTube && isInstagramUrl(mediaUrl);
  const instagramStreamUrl = isInstagram
    ? getInstagramStreamUrl(mediaUrl, igRetryCount > 0, igRetryNonce || undefined)
    : null;
  const instagramThumbUrl = isInstagram ? getInstagramThumbUrl(mediaUrl) : null;
  const instagramEmbedUrl = isInstagram ? getInstagramEmbedUrl(mediaUrl) : null;
  const isInstagramFallbackEmbed = isInstagram && (!instagramStreamUrl || igStreamFailed);

  // Determine if video or audio
  const isAudioOnly =
    /\.(mp3|wav|m4a|aac|flac|ogg)($|\?)/i.test(mediaUrl) && !isYouTube && !isInstagram;
  const isVideo = !isAudioOnly;

  const getYouTubeEmbedUrl = () => {
    if (!youtubeId) return null;
    const origin = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&controls=1&rel=0&modestbranding=1${origin}`;
  };

  const handleLike = async () => {
    if (!effectiveUser) {
      openAuthModal('signin');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    const prevLiked = hasLiked;
    const prevCount = likesCount;
    setHasLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.toggleLike('speech', speech.id);
      invalidateActivityCache('speech', speech.id);
      setHasLiked(res.liked);
      setLikesCount(res.likes_count);
      onSpeechStatsUpdated?.(speech.id, { likes_count: res.likes_count });
    } catch (err) {
      setHasLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const isSaved = isBookmarked('speech', speech.id);
  const handleSave = async () => {
    if (!effectiveUser) {
      openAuthModal('signin');
      return;
    }
    const prevCount = savesCount;
    const optimisticNext = isSaved ? Math.max(0, prevCount - 1) : prevCount + 1;
    setSavesCount(optimisticNext);
    await toggleBookmark('speech', speech.id);
    invalidateActivityCache('speech', speech.id);
    try {
      const fresh = await api.getInteractions('speech', speech.id);
      const exactSaves = fresh.saves_count ?? optimisticNext;
      setSavesCount(exactSaves);
      onSpeechStatsUpdated?.(speech.id, { saves_count: exactSaves });
    } catch {
      onSpeechStatsUpdated?.(speech.id, { saves_count: optimisticNext });
    }
  };

  const handleShareRecorded = async (platform: string) => {
    try {
      const res = await api.recordShare('speech', speech.id, platform);
      invalidateActivityCache('speech', speech.id);
      setSharesCount(res.shares_count);
      onSpeechStatsUpdated?.(speech.id, { shares_count: res.shares_count });
    } catch {
      // Ignore
    }
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const thumbnailSrc = resolveMediaThumbnail(speech.thumbnail, speech.media_url);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-[#064E3B] text-white flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-4">
            <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold block mb-0.5">
              {speech.speech_type || 'Islahi Taqreer'}
            </span>
            <h3 className="text-sm sm:text-base font-bold truncate text-white leading-tight">
              {speech.title || 'Speech'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
            aria-label="Close media player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Player Area (Safe container prevents white-screen crashes) */}
        <div className="bg-black relative flex items-center justify-center min-h-[220px] max-h-[420px] overflow-hidden shrink-0">
          {isYouTube ? (
            <div className="w-full h-64 sm:h-80 md:h-96 relative bg-black flex flex-col items-center justify-center">
              {getYouTubeEmbedUrl() ? (
                <iframe
                  ref={iframeRef}
                  src={getYouTubeEmbedUrl()!}
                  title={speech.title || 'YouTube Player'}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={() => {
                    sendYouTubeCommand('listening');
                  }}
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Play className="w-10 h-10 text-[#D4AF37] mx-auto" />
                  <p className="text-white text-xs font-semibold">External Video Discourse</p>
                  {mediaUrl && (
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Watch Directly on YouTube ↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : isInstagramFallbackEmbed ? (
            <div className="w-full h-[380px] sm:h-[420px] relative bg-black flex flex-col items-center justify-center overflow-hidden">
              {instagramEmbedUrl ? (
                <InstagramVideoEmbed
                  embedUrl={instagramEmbedUrl}
                  title={speech.title || 'Instagram Video Player'}
                  className="max-w-md"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Play className="w-10 h-10 text-[#D4AF37] mx-auto" />
                  <p className="text-white text-xs font-semibold">Instagram Video Discourse</p>
                  {mediaUrl && (
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-amber-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Watch Directly on Instagram ↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : isVideo && mediaUrl ? (
            <div className="w-full relative group bg-black flex items-center justify-center">
              <video
                key={`${speech.id}-${isInstagram && instagramStreamUrl ? instagramStreamUrl : mediaUrl}`}
                ref={videoRef}
                src={isInstagram && instagramStreamUrl ? instagramStreamUrl : mediaUrl}
                poster={speech.thumbnail || instagramThumbUrl || undefined}
                controls
                autoPlay
                playsInline
                preload="metadata"
                onError={() => {
                  if (isInstagram) {
                    if (igRetryCount < 2) {
                      setIgRetryCount((c) => c + 1);
                      setIgRetryNonce(Date.now());
                    } else if (!igStreamFailed) {
                      setIgStreamFailed(true);
                    }
                  }
                }}
                className="w-full max-h-[380px] object-contain mx-auto bg-black"
              />
            </div>
          ) : (
            /* Audio Player with Spiritual Card */
            <div className="w-full py-8 px-6 flex flex-col items-center justify-center bg-radial from-[#064E3B]/90 to-[#022118] text-white">
              <img
                src={thumbnailSrc}
                alt={speech.title}
                className="w-20 h-20 rounded-xl object-cover mb-3 border border-[#D4AF37]/50 shadow-md"
              />
              <p className="text-sm font-semibold text-center mb-1 text-white max-w-md line-clamp-2">
                {speech.title}
              </p>
              <p className="text-xs text-emerald-200/80 mb-4 text-center">
                {speech.scholar_title ? `${speech.scholar_title} ` : ''}
                {speech.scholar_name || 'Scholar of Ahl-e-Sunnat'}
              </p>
              {mediaUrl && (
                <audio
                  ref={audioRef}
                  src={mediaUrl}
                  controls
                  autoPlay
                  className="w-full max-w-md accent-[#D4AF37]"
                />
              )}
            </div>
          )}
        </div>

        {/* Media Control Bar: Speed, Rewind, Forward, Download */}
        <div className="px-4 py-2.5 bg-stone-900 text-stone-200 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
          {!isInstagramFallbackEmbed ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => skipMedia(-10)}
                title="Rewind 10 seconds (-10s)"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold border border-white/5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>-10s</span>
              </button>
              <button
                onClick={() => skipMedia(10)}
                title="Forward 10 seconds (+10s)"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold border border-white/5 active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>+10s</span>
              </button>

              {/* Speed Selector (Controls both HTML5 Video/Audio & YouTube) */}
              <div className="flex items-center gap-1 bg-stone-800/80 p-0.5 rounded-md border border-stone-700">
                <span className="text-[10px] text-stone-400 px-1 font-mono uppercase flex items-center gap-0.5">
                  <Gauge className="w-3 h-3 text-[#D4AF37]" /> Speed:
                </span>
                {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      playbackSpeed === s
                        ? 'bg-[#D4AF37] text-stone-950 font-bold shadow-xs'
                        : 'text-stone-300 hover:text-white hover:bg-stone-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-stone-300 font-medium">
              Instagram Embedded Player (Tap inside video to play/unmute)
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* Direct Open in YouTube Button */}
            {isYouTube && mediaUrl && (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                title="Watch on YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>YouTube ↗</span>
              </a>
            )}

            {/* Retry Direct Stream + Open in Instagram (only in fallback embed mode) */}
            {isInstagramFallbackEmbed && mediaUrl && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIgStreamFailed(false);
                    setIgRetryCount(1);
                    setIgRetryNonce(Date.now());
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                  title="Direct Video Stream Dubara Chalayein"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Video</span>
                </button>
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-fuchsia-600 to-amber-500 hover:opacity-90 text-white rounded text-xs font-semibold transition-opacity cursor-pointer"
                  title="Watch on Instagram"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Instagram ↗</span>
                </a>
              </>
            )}

            {/* Download button for uploaded video/audio files & streamed Instagram videos */}
            {!isYouTube && !isInstagramFallbackEmbed && mediaUrl && (
              <a
                href={isInstagram && instagramStreamUrl ? instagramStreamUrl : mediaUrl}
                download={speech.title || 'speech'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                title="Download video or audio file to your device"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
          </div>
        </div>

        {/* Social Interaction Action Bar (Instagram-style Hover/Click IDs for Views, Likes, Saves, Shares) */}
        <div className="px-4 sm:px-5 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {/* Views (Hover or click to view IDs) */}
            <StatActivityButton
              itemType="speech"
              itemId={speech.id}
              itemTitle={speech.title}
              tab="views"
              count={viewsCount}
              label={viewsCount === 1 ? 'View' : 'Views'}
              popoverAlign="left"
              popoverDirection="down"
              onOpenModal={setActivityModalTab}
              className="font-semibold text-stone-700 hover:text-[#064E3B] py-1"
              icon={<Eye className="w-4 h-4 text-[#064E3B]" />}
            />

            {/* Like (Heart toggles like; Hover/click count shows Who Liked IDs) */}
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={handleLike}
                className={`inline-flex items-center gap-1 font-bold transition-colors cursor-pointer py-1 ${
                  hasLiked ? 'text-rose-600' : 'text-stone-600 hover:text-stone-900'
                }`}
                title={hasLiked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
              <StatActivityButton
                itemType="speech"
                itemId={speech.id}
                itemTitle={speech.title}
                tab="likes"
                count={likesCount}
                label={likesCount === 1 ? 'Like' : 'Likes'}
                popoverAlign="left"
                popoverDirection="down"
                onOpenModal={setActivityModalTab}
                className={`font-bold py-1 underline decoration-stone-300 underline-offset-2 ${
                  hasLiked ? 'text-rose-600' : 'text-stone-600 hover:text-stone-900'
                }`}
                icon={<span className="sr-only">Likes</span>}
              />
            </div>

            {/* Comments button */}
            <button
              onClick={scrollToComments}
              className="flex items-center gap-1.5 font-semibold text-stone-600 hover:text-[#064E3B] transition-colors cursor-pointer tabular-nums"
            >
              <MessageSquare className="w-4 h-4 text-[#064E3B]" />
              <span>{comments.length.toLocaleString()} Comments</span>
            </button>

            {/* Save (Bookmark toggles save; Hover/click count shows Saved By IDs) */}
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={handleSave}
                className={`inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer py-1 ${
                  isSaved ? 'text-[#D4AF37] font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
              <StatActivityButton
                itemType="speech"
                itemId={speech.id}
                itemTitle={speech.title}
                tab="saves"
                count={savesCount}
                popoverAlign="left"
                popoverDirection="down"
                onOpenModal={setActivityModalTab}
                className="font-semibold text-stone-500 hover:text-[#064E3B] py-1"
                icon={<span className="text-[10px]">•</span>}
              />
            </div>
          </div>

          {/* Share (Opens ShareModal; Hover/click count shows Shared By IDs) */}
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-1 font-semibold text-stone-600 hover:text-[#064E3B] transition-colors cursor-pointer py-1"
              title="Share Speech"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <StatActivityButton
              itemType="speech"
              itemId={speech.id}
              itemTitle={speech.title}
              tab="shares"
              count={sharesCount}
              popoverAlign="right"
              popoverDirection="down"
              onOpenModal={setActivityModalTab}
              className="font-semibold text-stone-500 hover:text-[#064E3B] py-1"
              icon={<span className="text-[10px]">•</span>}
            />
          </div>
        </div>

        {/* Speech Metadata & Comments Container */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
          {/* Speech Details */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-600 border-b border-stone-100 pb-3">
              {speech.scholar_name && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#064E3B]" />
                  {speech.scholar_slug && onNavigateScholar ? (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateScholar(speech.scholar_slug!);
                      }}
                      className="font-medium text-[#064E3B] hover:text-[#075c46] underline underline-offset-2 cursor-pointer"
                    >
                      {speech.scholar_name}
                    </button>
                  ) : (
                    <span className="font-medium text-stone-900">{speech.scholar_name}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#064E3B]" />
                <span>{speech.upload_date}</span>
              </div>

              {speech.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#064E3B]" />
                  <span>{speech.duration}</span>
                </div>
              )}
            </div>

            {speech.description && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1">
                  Description & Khulasa
                </h4>
                <p className="text-xs leading-relaxed text-stone-700 whitespace-pre-line font-sans">
                  {speech.description}
                </p>
              </div>
            )}

            {speech.tags && (
              <div className="flex items-center gap-2 pt-1">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <div className="text-xs text-stone-500">
                  {speech.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="mr-2">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Comments & Reflections Section */}
          <div ref={commentsRef} className="pt-2 border-t border-stone-200">
            <CommentsSection
              itemType="speech"
              itemId={speech.id}
              itemTitle={speech.title}
              comments={comments}
              onCommentAdded={(newComment) => {
                setComments((prev) => {
                  const next = [newComment, ...prev];
                  onSpeechStatsUpdated?.(speech.id, { comments_count: next.length });
                  return next;
                });
              }}
              onCommentDeleted={(deletedId) => {
                setComments((prev) => {
                  const next = prev.filter((c) => c.id !== deletedId);
                  onSpeechStatsUpdated?.(speech.id, { comments_count: next.length });
                  return next;
                });
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span className="font-mono text-[10px] text-[#064E3B]">POWERED BY SYED ALI QALANDAR PEERZADE</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-md font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={speech.title}
        category={speech.speech_type}
        onShare={handleShareRecorded}
      />

      {/* Instagram-style Views / Likes / Shares / Saves ID List Modal */}
      <EngagementActivityModal
        isOpen={!!activityModalTab}
        onClose={() => setActivityModalTab(null)}
        itemType="speech"
        itemId={speech.id}
        itemTitle={speech.title}
        initialTab={activityModalTab || 'views'}
      />
    </div>
  );
};
