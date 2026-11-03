import React, { useState, useRef } from 'react';
import { Film, Plus, Edit2, Trash2, Check, X, Upload, Play, AlertCircle, Link as LinkIcon, FileVideo, CheckCircle2 } from 'lucide-react';
import { Reel, Scholar } from '../../types';
import { api } from '../../services/api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { extractYouTubeThumbnail } from '../../utils/media';

interface AdminReelsProps {
  reels: Reel[];
  scholars: Scholar[];
  onRefresh: () => void;
  onPreviewReel: (reel: Reel) => void;
}

export const AdminReels: React.FC<AdminReelsProps> = ({
  reels,
  scholars,
  onRefresh,
  onPreviewReel
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [reelToDelete, setReelToDelete] = useState<Reel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'url'>('upload');
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [scholarId, setScholarId] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [duration, setDuration] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openCreateModal = () => {
    setEditingReel(null);
    setTitle('');
    setScholarId(scholars[0]?.id || '');
    setDescription('');
    setVideoUrl('');
    setThumbnail('');
    setDuration('0:58');
    setIsPublished(true);
    setVideoSourceType('upload');
    setUploadedFileName('');
    setUploadProgress(0);
    setError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (reel: Reel) => {
    setEditingReel(reel);
    setTitle(reel.title);
    setScholarId(reel.scholar_id);
    setDescription(reel.description || '');
    setVideoUrl(reel.video_url);
    setThumbnail(reel.thumbnail || '');
    setDuration(reel.duration || '');
    setIsPublished(reel.is_published === 1);
    setVideoSourceType(reel.video_url.startsWith('/uploads/') ? 'upload' : 'url');
    setUploadedFileName(reel.video_url.startsWith('/uploads/') ? reel.video_url.split('/').pop() || '' : '');
    setUploadProgress(0);
    setError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);
    setError(null);
    setUploadError(null);

    // Auto-detect duration from file
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        window.URL.revokeObjectURL(tempVideo.src);
        const secs = Math.round(tempVideo.duration);
        if (!isNaN(secs) && secs > 0) {
          const m = Math.floor(secs / 60);
          const s = secs % 60;
          setDuration(`${m}:${s < 10 ? '0' : ''}${s}`);
        }
      };
      tempVideo.src = URL.createObjectURL(file);
    } catch {
      // Ignore if duration metadata cannot be parsed
    }

    try {
      const res = await api.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      });
      setVideoUrl(res.url);
      setUploadedFileName(res.filename || file.name);
      setUploadProgress(100);
      setUploadError(null);
    } catch (err: any) {
      console.error('Reel upload error:', err);
      const msg = err.message || 'Video upload failed. Please try again.';
      setError(msg);
      setUploadError(msg);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingThumb(true);
    setError(null);

    try {
      const res = await api.uploadFile(file);
      setThumbnail(res.url);
    } catch (err: any) {
      setError(err.message || 'Thumbnail upload failed');
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scholarId || !videoUrl) {
      setError('Title, scholar, and video URL are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const resolvedThumb = (!thumbnail || thumbnail.includes('google.com') || !thumbnail.trim())
      ? (extractYouTubeThumbnail(videoUrl) || thumbnail || null)
      : thumbnail;

    try {
      if (editingReel) {
        await api.updateReel(editingReel.id, {
          title,
          scholar_id: scholarId,
          description,
          video_url: videoUrl,
          thumbnail: resolvedThumb,
          duration,
          is_published: isPublished ? 1 : 0
        });
      } else {
        await api.createReel({
          title,
          scholar_id: scholarId,
          description,
          video_url: videoUrl,
          thumbnail: resolvedThumb,
          duration,
          is_published: isPublished ? 1 : 0
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save reel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteReel = async () => {
    if (!reelToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteReel(reelToDelete.id);
      setReelToDelete(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete reel');
    } finally {
      setIsDeleting(false);
    }
  };


  const handleTogglePublish = async (reel: Reel) => {
    try {
      await api.updateReel(reel.id, {
        is_published: reel.is_published === 1 ? 0 : 1
      });
      onRefresh();
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            Reels Management ({reels.length})
          </h2>
          <p className="text-xs text-stone-500">
            Curate vertical 9:16 short spiritual videos and link them to scholar profiles.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>Upload Reel</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Scholar</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {reels.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900 max-w-xs truncate">
                    {r.title}
                  </td>
                  <td className="py-3 px-4 text-emerald-900 font-medium whitespace-nowrap">
                    {r.scholar_name}
                  </td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                    {r.duration || 'Short'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublish(r)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        r.is_published === 1
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}
                    >
                      {r.is_published === 1 ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          <span>Draft</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onPreviewReel(r)}
                      className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      title="Preview Reel"
                    >
                      <Play className="w-4 h-4 fill-emerald-700" />
                    </button>
                    <button
                      onClick={() => openEditModal(r)}
                      className="p-1.5 text-stone-500 hover:text-[#064E3B] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                      title="Edit Reel"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReelToDelete(r)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Reel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Reel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingReel ? 'Edit Reel' : 'Add New Islamic Reel'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Reel Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="e.g. Sabr Ka Ajr Wa Fazilat"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Channel / Scholar *
                </label>
                <select
                  required
                  value={scholarId}
                  onChange={(e) => setScholarId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
                >
                  <option value="" disabled>Select Channel or Scholar</option>
                  <optgroup label="Spiritual Topics & Channels">
                    <option value="sch-madina-sharif">Madina Munawwarah Sharif (Haramain Ziyarat)</option>
                    <option value="sch-dunya-akhirat">Dunya Wa Akhirat Ki Fikr (Spiritual Reminders)</option>
                    <option value="sch-general-islam">General Islamic & Roohaniyat (Daily Sunan & Duas)</option>
                  </optgroup>
                  <optgroup label="Respected Scholars (Ulama-e-Kiram)">
                    {scholars
                      .filter((s) => !['sch-madina-sharif', 'sch-dunya-akhirat', 'sch-general-islam'].includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.honorific_title ? `${s.honorific_title} - ` : ''}{s.full_name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Dual-Mode Video Source: Upload File vs Link URL */}
              <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-stone-800 text-xs uppercase tracking-wider">
                    Reel Video Source *
                  </label>
                  <span className="text-[10px] text-stone-500 font-medium">
                    MP4, WebM, MOV (Upload up to several GBs supported, or Paste Link URL)
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/80 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('upload')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all cursor-pointer ${
                      videoSourceType === 'upload'
                        ? 'bg-[#064E3B] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <FileVideo className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('url')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all cursor-pointer ${
                      videoSourceType === 'url'
                        ? 'bg-[#064E3B] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Paste Link / URL</span>
                  </button>
                </div>

                {/* Option 1: Direct File Upload */}
                {videoSourceType === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,video/mp4,video/webm,video/quicktime,video/x-matroska,video/3gpp"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={isUploadingVideo}
                    />

                    {uploadError && (
                      <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold">Video Upload Failed / اپلوڈ نہیں ہوسکا:</p>
                          <p className="text-[11px] mt-0.5">{uploadError}</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-semibold cursor-pointer shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Retry / دوبارہ فائل منتخب کریں</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => !isUploadingVideo && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                        videoUrl
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : uploadError
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-stone-300 hover:border-[#064E3B] hover:bg-white'
                      }`}
                    >
                      {isUploadingVideo ? (
                        <div className="space-y-3 py-3">
                          <Upload className="w-9 h-9 text-[#064E3B] animate-bounce mx-auto" />
                          <div>
                            <p className="text-xs font-bold text-stone-800">
                              Uploading Reel Video... {uploadProgress}%
                            </p>
                            <p className="text-[11px] text-stone-600 font-mono mt-0.5">
                              {uploadedFileName}
                            </p>
                          </div>
                          <div className="w-full max-w-xs mx-auto bg-stone-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-[#064E3B] h-2.5 transition-all duration-200"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-stone-500">
                            {uploadProgress === 100
                              ? 'Saving and processing video on server... please wait'
                              : 'Please wait while your video file is being uploaded.'}
                          </p>
                        </div>
                      ) : videoUrl ? (
                        <div className="space-y-3 py-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-900">
                              Reel Video Uploaded & Ready!
                            </p>
                            <p className="text-[11px] text-stone-600 font-mono truncate max-w-sm mx-auto mt-0.5">
                              {uploadedFileName || videoUrl.split('/').pop()}
                            </p>
                          </div>

                          {/* Live Video Player Preview */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-xs mx-auto bg-black rounded-lg overflow-hidden shadow-inner border border-stone-300"
                          >
                            <video
                              src={videoUrl}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full max-h-48 object-contain"
                            />
                          </div>

                          <div className="pt-1 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="text-[11px] text-[#064E3B] hover:text-emerald-800 font-semibold underline cursor-pointer"
                            >
                              Choose a different video file
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 text-[#064E3B] flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6 text-[#064E3B]" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-800">
                              Click to Choose Reel Video from Device
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Select any MP4, WebM, or MOV video file from your mobile or PC
                            </p>
                          </div>
                          <span className="inline-block px-3.5 py-1.5 bg-[#064E3B] hover:bg-[#053d2e] text-white text-[11px] font-semibold rounded-md shadow-xs">
                            Select Video File (MP4 / WebM / MOV)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Option 2: Link / MP4 URL */}
                {videoSourceType === 'url' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-700">
                      Direct MP4 URL or YouTube Shorts URL
                    </label>
                    <input
                      type="text"
                      required={videoSourceType === 'url'}
                      value={videoUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVideoUrl(val);
                        const ytThumb = extractYouTubeThumbnail(val);
                        if (ytThumb && (!thumbnail || thumbnail.includes('google.com') || !thumbnail.trim())) {
                          setThumbnail(ytThumb);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] bg-white font-mono"
                      placeholder="https://example.com/videos/reel1.mp4 or https://youtube.com/shorts/..."
                    />
                    {extractYouTubeThumbnail(videoUrl) && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>YouTube Shorts/Video recognized. Thumbnail auto-synced!</span>
                      </p>
                    )}
                    <p className="text-[10px] text-stone-500 mt-1">
                      Paste a direct link to an MP4 video or a public YouTube Shorts link.
                    </p>
                  </div>
                )}

                {/* Instant Live Video Preview Box */}
                {videoUrl && (
                  <div className="mt-3 pt-3 border-t border-stone-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-[#064E3B]" />
                        <span>Live Video Preview:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoUrl('');
                          setUploadedFileName('');
                        }}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove / Clear Video
                      </button>
                    </div>

                    <div className="max-w-[200px] mx-auto aspect-9/16 bg-black rounded-lg overflow-hidden border border-stone-300 shadow-sm flex items-center justify-center">
                      {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                        <div className="p-3 text-center text-white text-[11px]">
                          <Film className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                          <span>YouTube Reel Linked</span>
                        </div>
                      ) : (
                        <video
                          src={videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Thumbnail Image (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="Thumbnail URL or upload..."
                  />
                  <label className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer border border-stone-300 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingThumb ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbUpload}
                      className="hidden"
                      disabled={isUploadingThumb}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Duration (e.g. 0:45, 1:00)
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="0:58"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Description / Points (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="Short note or hadith citation..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reel_publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                />
                <label htmlFor="reel_publish" className="font-semibold text-stone-800">
                  Publish reel publicly
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingReel ? 'Update Reel' : 'Publish Reel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Reel Modal */}
      <ConfirmDeleteModal
        isOpen={!!reelToDelete}
        title="Delete Reel"
        message="Are you sure you want to delete this reel? It will be permanently removed from all video feeds."
        itemName={reelToDelete?.title}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteReel}
        onCancel={() => setReelToDelete(null)}
      />

    </div>
  );
};

