import React, { useState, useRef } from 'react';
import { Volume2, Plus, Edit2, Trash2, Check, X, Upload, Play, AlertCircle, Link as LinkIcon, FileVideo, Music, CheckCircle2 } from 'lucide-react';
import { Speech, Scholar } from '../../types';
import { api } from '../../services/api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { extractYouTubeThumbnail, isInstagramUrl, getInstagramEmbedUrl } from '../../utils/media';

interface AdminSpeechesProps {
  speeches: Speech[];
  scholars: Scholar[];
  onRefresh: () => void;
  onPreviewSpeech: (speech: Speech) => void;
}

export const AdminSpeeches: React.FC<AdminSpeechesProps> = ({
  speeches,
  scholars,
  onRefresh,
  onPreviewSpeech
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpeech, setEditingSpeech] = useState<Speech | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [mediaSourceType, setMediaSourceType] = useState<'upload' | 'url'>('upload');
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [scholarId, setScholarId] = useState('');
  const [speechType, setSpeechType] = useState<'Islahi Taqreer' | 'Ilmi Taqreer'>('Islahi Taqreer');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openCreateModal = () => {
    setEditingSpeech(null);
    setTitle('');
    setScholarId(scholars[0]?.id || '');
    setSpeechType('Islahi Taqreer');
    setDescription('');
    setThumbnail('');
    setMediaUrl('');
    setDuration('');
    setUploadDate(new Date().toISOString().split('T')[0]);
    setTags('');
    setIsPublished(true);
    setMediaSourceType('upload');
    setUploadedFileName('');
    setUploadProgress(0);
    setError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (speech: Speech) => {
    setEditingSpeech(speech);
    setTitle(speech.title);
    setScholarId(speech.scholar_id);
    setSpeechType(speech.speech_type);
    setDescription(speech.description || '');
    setThumbnail(speech.thumbnail || '');
    setMediaUrl(speech.media_url);
    setDuration(speech.duration || '');
    setUploadDate(speech.upload_date);
    setTags(speech.tags || '');
    setIsPublished(speech.is_published === 1);
    setMediaSourceType(speech.media_url.startsWith('/uploads/') ? 'upload' : 'url');
    setUploadedFileName(speech.media_url.startsWith('/uploads/') ? speech.media_url.split('/').pop() || '' : '');
    setUploadProgress(0);
    setError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);
    setError(null);
    setUploadError(null);

    // Auto-detect duration from audio/video file
    try {
      const isVid = file.type.startsWith('video');
      const tempMedia = document.createElement(isVid ? 'video' : 'audio');
      tempMedia.preload = 'metadata';
      tempMedia.onloadedmetadata = () => {
        window.URL.revokeObjectURL(tempMedia.src);
        const secs = Math.round(tempMedia.duration);
        if (!isNaN(secs) && secs > 0) {
          const m = Math.floor(secs / 60);
          const s = secs % 60;
          setDuration(`${m}:${s < 10 ? '0' : ''}${s}`);
        }
      };
      tempMedia.src = URL.createObjectURL(file);
    } catch {
      // Ignore if duration metadata cannot be read
    }

    try {
      const res = await api.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      });
      setMediaUrl(res.url);
      setUploadedFileName(res.filename || file.name);
      setUploadProgress(100);
      setUploadError(null);
    } catch (err: any) {
      console.error('Speech media upload failed:', err);
      const msg = err.message || 'Media file upload failed. Please try again.';
      setError(msg);
      setUploadError(msg);
    } finally {
      setIsUploadingMedia(false);
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
    if (!title || !scholarId || !speechType || !mediaUrl) {
      setError('Title, scholar, speech type, and media URL are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const resolvedThumb = (!thumbnail || thumbnail.includes('google.com') || !thumbnail.trim())
      ? (extractYouTubeThumbnail(mediaUrl) || thumbnail || null)
      : thumbnail;

    try {
      if (editingSpeech) {
        await api.updateSpeech(editingSpeech.id, {
          title,
          scholar_id: scholarId,
          speech_type: speechType,
          description,
          thumbnail: resolvedThumb,
          media_url: mediaUrl,
          duration,
          upload_date: uploadDate,
          tags,
          is_published: isPublished ? 1 : 0
        });
      } else {
        await api.createSpeech({
          title,
          scholar_id: scholarId,
          speech_type: speechType,
          description,
          thumbnail: resolvedThumb,
          media_url: mediaUrl,
          duration,
          upload_date: uploadDate,
          tags,
          is_published: isPublished ? 1 : 0
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save speech');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [speechToDelete, setSpeechToDelete] = useState<Speech | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!speechToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteSpeech(speechToDelete.id);
      setSpeechToDelete(null);
      onRefresh();
    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (speech: Speech) => {
    try {
      await api.updateSpeech(speech.id, {
        is_published: speech.is_published === 1 ? 0 : 1
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
            Speeches Management ({speeches.length})
          </h2>
          <p className="text-xs text-stone-500">
            Upload and categorize Islahi and Ilmi Taqreers of respected Ahl-e-Sunnat Ulama.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>Upload Speech</span>
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
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {speeches.map((sp) => (
                <tr key={sp.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900 max-w-xs truncate">
                    {sp.title}
                  </td>
                  <td className="py-3 px-4 text-emerald-900 font-medium whitespace-nowrap">
                    {sp.scholar_name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold text-[10px]">
                      {sp.speech_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                    {sp.duration || '—'}
                  </td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                    {sp.upload_date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublish(sp)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        sp.is_published === 1
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}
                    >
                      {sp.is_published === 1 ? (
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
                      onClick={() => onPreviewSpeech(sp)}
                      className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      title="Preview Speech"
                    >
                      <Play className="w-4 h-4 fill-emerald-700" />
                    </button>
                    <button
                      onClick={() => openEditModal(sp)}
                      className="p-1.5 text-stone-500 hover:text-[#064E3B] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                      title="Edit Speech"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSpeechToDelete(sp)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Speech"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingSpeech ? 'Edit Speech' : 'Upload New Speech'}
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
                  Speech Title (Unwan) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="e.g. Faza'il-e-Ahle Bayt wa Sahaba"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Scholar *
                  </label>
                  <select
                    required
                    value={scholarId}
                    onChange={(e) => setScholarId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
                  >
                    <option value="" disabled>Select Scholar</option>
                    {scholars.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.honorific_title ? `${s.honorific_title} - ` : ''}{s.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Speech Type *
                  </label>
                  <select
                    required
                    value={speechType}
                    onChange={(e) => setSpeechType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
                  >
                    <option value="Islahi Taqreer">Islahi Taqreer (Moral Admonition)</option>
                    <option value="Ilmi Taqreer">Ilmi Taqreer (Academic Discourse)</option>
                    <option value="Seerat-un-Nabi">Seerat-un-Nabi ﷺ</option>
                    <option value="Ahle Bait wa Sahaba">Ahle Bait wa Sahaba</option>
                    <option value="Aqaid wa Fiqh">Aqaid wa Fiqh (Creed & Jurisprudence)</option>
                    <option value="Dars-e-Quran">Dars-e-Quran (Exegesis)</option>
                    <option value="Juma Khutbah">Juma Khutbah & Bayan</option>
                  </select>
                </div>
              </div>

              {/* Dual-Mode Media Source: Upload File vs Link URL */}
              <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-stone-800 text-xs uppercase tracking-wider">
                    Speech Audio / Video Media Source *
                  </label>
                  <span className="text-[10px] text-stone-500 font-medium">
                    MP4, MP3, WebM, MOV (Upload up to several GBs supported, or Paste Link URL)
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/80 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMediaSourceType('upload')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all cursor-pointer ${
                      mediaSourceType === 'upload'
                        ? 'bg-[#064E3B] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File from Device</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaSourceType('url')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all cursor-pointer ${
                      mediaSourceType === 'url'
                        ? 'bg-[#064E3B] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Paste Link / URL</span>
                  </button>
                </div>

                {/* Option 1: Direct File Upload */}
                {mediaSourceType === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,audio/*,video/mp4,video/webm,video/quicktime,video/x-matroska,audio/mpeg,audio/mp3,audio/wav,audio/m4a"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={handleMediaUpload}
                      className="hidden"
                      disabled={isUploadingMedia}
                    />

                    {uploadError && (
                      <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold">Media Upload Failed / اپلوڈ نہیں ہوسکا:</p>
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
                      onClick={() => !isUploadingMedia && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                        mediaUrl
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : uploadError
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-stone-300 hover:border-[#064E3B] hover:bg-white'
                      }`}
                    >
                      {isUploadingMedia ? (
                        <div className="space-y-3 py-3">
                          <Upload className="w-9 h-9 text-[#064E3B] animate-bounce mx-auto" />
                          <div>
                            <p className="text-xs font-bold text-stone-800">
                              Uploading Speech Media... {uploadProgress}%
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
                              ? 'Saving and processing media on server... please wait'
                              : 'Please wait while your audio or video file is being uploaded.'}
                          </p>
                        </div>
                      ) : mediaUrl ? (
                        <div className="space-y-3 py-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-900">
                              Media File Uploaded & Ready!
                            </p>
                            <p className="text-[11px] text-stone-600 font-mono truncate max-w-sm mx-auto mt-0.5">
                              {uploadedFileName || mediaUrl.split('/').pop()}
                            </p>
                          </div>

                          {/* Live Media Player Preview (Video or Audio) */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm mx-auto bg-stone-900 rounded-lg overflow-hidden shadow-inner border border-stone-300 p-2"
                          >
                            {/\.(mp4|webm|mov|m4v|mkv)$/i.test(mediaUrl) || (!/\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(mediaUrl) && !mediaUrl.includes('audio')) ? (
                              <video
                                src={mediaUrl}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full max-h-48 object-contain bg-black rounded"
                              />
                            ) : (
                              <div className="py-2">
                                <audio
                                  src={mediaUrl}
                                  controls
                                  preload="metadata"
                                  className="w-full"
                                />
                              </div>
                            )}
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
                              Choose a different audio or video file
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 text-[#064E3B] flex items-center justify-center mx-auto">
                            <FileVideo className="w-6 h-6 text-[#064E3B]" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-800">
                              Click to Choose Speech File from Device
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Supports MP4, WebM, MOV video files or MP3, M4A, WAV audio files
                            </p>
                          </div>
                          <span className="inline-block px-3.5 py-1.5 bg-[#064E3B] hover:bg-[#053d2e] text-white text-[11px] font-semibold rounded-md shadow-xs">
                            Select Audio or Video File
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Option 2: Link / URL */}
                {mediaSourceType === 'url' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-700">
                      Direct MP4 / MP3 URL, YouTube, or Instagram Link
                    </label>
                    <input
                      type="text"
                      required={mediaSourceType === 'url'}
                      value={mediaUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMediaUrl(val);
                        const ytThumb = extractYouTubeThumbnail(val);
                        if (ytThumb && (!thumbnail || thumbnail.includes('google.com') || !thumbnail.trim())) {
                          setThumbnail(ytThumb);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] bg-white font-mono"
                      placeholder="https://youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                    />
                    {extractYouTubeThumbnail(mediaUrl) && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>YouTube video recognized. Thumbnail auto-synced & ready for Home Page!</span>
                      </p>
                    )}
                    {isInstagramUrl(mediaUrl) && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {getInstagramEmbedUrl(mediaUrl)
                            ? 'Instagram Reel / Video recognized & ready to embed!'
                            : 'Instagram link detected — please use a direct /reel/ or /p/ URL.'}
                        </span>
                      </p>
                    )}
                    <p className="text-[10px] text-stone-500 mt-1">
                      Paste a direct link to an MP4 video, MP3 audio, public YouTube link, or Instagram Reel/Post link.
                    </p>
                  </div>
                )}

                {/* Instant Live Player Preview Box */}
                {mediaUrl && (
                  <div className="mt-3 pt-3 border-t border-stone-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-[#064E3B]" />
                        <span>Live Media Player Preview:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaUrl('');
                          setUploadedFileName('');
                        }}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove / Clear Media
                      </button>
                    </div>

                    <div className="bg-black/90 rounded-lg overflow-hidden border border-stone-300 shadow-sm p-2 flex items-center justify-center">
                      {mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? (
                        <div className="p-3 text-center text-white text-[11px]">
                          <Volume2 className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                          <span>YouTube Speech Linked</span>
                        </div>
                      ) : isInstagramUrl(mediaUrl) ? (
                        getInstagramEmbedUrl(mediaUrl) ? (
                          <iframe
                            src={getInstagramEmbedUrl(mediaUrl)!}
                            title="Instagram Speech Preview"
                            className="w-full max-w-xs h-72 border-0 rounded bg-white"
                            allowFullScreen
                          />
                        ) : (
                          <div className="p-3 text-center text-white text-[11px]">
                            <Volume2 className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                            <span>Instagram Link Linked</span>
                          </div>
                        )
                      ) : /\.(mp4|webm|mov|m4v|mkv)($|\?)/i.test(mediaUrl) ? (
                        <video
                          src={mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-52 object-contain rounded"
                        />
                      ) : (
                        <div className="w-full py-2 px-3">
                          <audio
                            src={mediaUrl}
                            controls
                            preload="metadata"
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Thumbnail Image URL / Upload (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="https://... or /uploads/..."
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Duration (e.g. 45 min, 1h 12m)
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="42 min"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Upload Date
                  </label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="Seerat, Taqwa, Fiqh, Ahle Sunnat"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Description / Khulasa
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="Summary of discourse points discussed..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="speech_publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                />
                <label htmlFor="speech_publish" className="font-semibold text-stone-800">
                  Publish speech on public website
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
                  {isSubmitting ? 'Saving...' : editingSpeech ? 'Update Speech' : 'Publish Speech'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Speech Deletion */}
      <ConfirmDeleteModal
        isOpen={!!speechToDelete}
        title="Delete Speech?"
        itemName={speechToDelete?.title}
        message="This Islamic speech (taqreer) will be permanently deleted from MISHKAAT, along with its associated records. Are you sure you want to proceed?"
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setSpeechToDelete(null)}
      />
    </div>
  );
};
