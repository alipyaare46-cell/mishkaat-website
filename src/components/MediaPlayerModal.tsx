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
  AlertCircle
} from 'lucide-react';
import { Speech } from '../types';
import { api } from '../services/api';
import { useUserAuth } from '../context/UserAuthContext';
import { useAuth } from '../context/AuthContext';
import { CommentsSection } from './CommentsSection';
import { ShareModal } from './ShareModal';
import { extractYouTubeId, resolveMediaThumbnail, isVideoMedia } from '../utils/media';

interface MediaPlayerModalProps {
  speech: Speech | null;
  onClose: () => void;
  onNavigateScholar?: (slug: string) => void;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ speech, onClose, onNavigateScholar }) => {
  const { user, isBookmarked, toggleBookmark, openAuthModal } = useUserAuth();
  const { admin } = useAuth();
  const effectiveUser = user || (admin ? { id: admin.id, full_name: admin.full_name || 'Admin' } : null);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Social interactions state
  const [likesCount, setLikesCount] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiking, setIsLiking] = useState(false);

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

  // Load interactions when speech opens
  const loadInteractions = useCallback(async (speechId: string) => {
    if (!speechId) return;
    try {
      const data = await api.getInteractions('speech', speechId);
      setLikesCount(data.likes_count || 0);
      setHasLiked(!!data.has_liked);
      setComments(data.comments || []);
    } catch (err) {
      console.warn('Could not load speech interactions:', err);
    }
  }, []);

  useEffect(() => {
    if (speech && speech.id) {
      loadInteractions(speech.id);
    }
  }, [speech?.id, loadInteractions]);

  if (!speech) return null;

  const mediaUrl = speech.media_url || '';
  const youtubeId = extractYouTubeId(mediaUrl);
  const isYouTube = !!youtubeId || mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be');

  // Determine if video or audio
  const isAudioOnly =
    /\.(mp3|wav|m4a|aac|flac|ogg)($|\?)/i.test(mediaUrl) && !isYouTube;
  const isVideo = !isAudioOnly;

  const getYouTubeEmbedUrl = () => {
    if (!youtubeId) return null;
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&controls=1&rel=0&modestbranding=1`;
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
      setHasLiked(res.liked);
      setLikesCount(res.likes_count);
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
    await toggleBookmark('speech', speech.id);
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
          ) : isVideo && mediaUrl ? (
            <div className="w-full relative group bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                src={mediaUrl}
                controls
                autoPlay
                playsInline
                preload="metadata"
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

            {/* Download button for uploaded video/audio files */}
            {!isYouTube && mediaUrl && (
              <a
                href={mediaUrl}
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

        {/* Social Interaction Action Bar (Like, Comment, Save, Share) */}
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                hasLiked ? 'text-rose-600' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
            </button>

            {/* Comments button */}
            <button
              onClick={scrollToComments}
              className="flex items-center gap-1.5 font-semibold text-stone-600 hover:text-[#064E3B] transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#064E3B]" />
              <span>{comments.length} Reflections</span>
            </button>

            {/* Save (Bookmark) */}
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                isSaved ? 'text-[#D4AF37] font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* Share */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 font-semibold text-stone-600 hover:text-[#064E3B] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
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
                setComments((prev) => [newComment, ...prev]);
              }}
              onCommentDeleted={(deletedId) => {
                setComments((prev) => prev.filter((c) => c.id !== deletedId));
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
      />
    </div>
  );
};
