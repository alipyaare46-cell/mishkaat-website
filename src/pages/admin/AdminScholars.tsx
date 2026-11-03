import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Check, X, Upload, MapPin, AlertCircle } from 'lucide-react';
import { Scholar } from '../../types';
import { api } from '../../services/api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface AdminScholarsProps {
  scholars: Scholar[];
  onRefresh: () => void;
}

export const AdminScholars: React.FC<AdminScholarsProps> = ({ scholars, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScholar, setEditingScholar] = useState<Scholar | null>(null);
  const [scholarToDelete, setScholarToDelete] = useState<Scholar | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [honorificTitle, setHonorificTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [biography, setBiography] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [location, setLocation] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const openCreateModal = () => {
    setEditingScholar(null);
    setFullName('');
    setHonorificTitle('');
    setSlug('');
    setBiography('');
    setProfileImage('');
    setLocation('');
    setIsPublished(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (scholar: Scholar) => {
    setEditingScholar(scholar);
    setFullName(scholar.full_name);
    setHonorificTitle(scholar.honorific_title);
    setSlug(scholar.slug);
    setBiography(scholar.biography || '');
    setProfileImage(scholar.profile_image || '');
    setLocation(scholar.location || '');
    setIsPublished(scholar.is_published === 1);
    setError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFullName(name);
    if (!editingScholar) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);

    // Try server upload first
    try {
      const res = await api.uploadFile(file);
      setProfileImage(res.url);
      setIsUploading(false);
      return;
    } catch {
      // Fallback to local image reader
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setProfileImage(compressed);
        } else {
          setProfileImage(rawData);
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setProfileImage(rawData);
        setIsUploading(false);
      };
      img.src = rawData;
    };
    reader.onerror = () => {
      setError('Failed to read image file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !honorificTitle || !slug) {
      setError('Full name, honorific title, and slug are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingScholar) {
        await api.updateScholar(editingScholar.id, {
          full_name: fullName,
          honorific_title: honorificTitle,
          slug,
          biography,
          profile_image: profileImage || null,
          location,
          is_published: isPublished ? 1 : 0
        });
      } else {
        await api.createScholar({
          full_name: fullName,
          honorific_title: honorificTitle,
          slug,
          biography,
          profile_image: profileImage || null,
          location,
          is_published: isPublished ? 1 : 0
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save scholar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteScholar = async () => {
    if (!scholarToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteScholar(scholarToDelete.id);
      setScholarToDelete(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete scholar');
    } finally {
      setIsDeleting(false);
    }
  };


  const handleTogglePublish = async (scholar: Scholar) => {
    try {
      await api.updateScholar(scholar.id, {
        is_published: scholar.is_published === 1 ? 0 : 1
      });
      onRefresh();
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            Scholars Management ({scholars.length})
          </h2>
          <p className="text-xs text-stone-500">
            Manage eminent scholars, honorific titles, biographical sketches, and publication visibility.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>Add New Scholar</span>
        </button>
      </div>

      {/* Scholars Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Scholar</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {scholars.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {s.profile_image ? (
                          <img
                            src={s.profile_image}
                            alt={s.full_name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-[#064E3B]" />
                        )}
                      </div>
                      <span className="font-semibold text-stone-900">
                        {s.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#D4AF37] font-semibold">
                    {s.honorific_title}
                  </td>
                  <td className="py-3 px-4 font-mono text-stone-400 text-[11px]">
                    {s.slug}
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {s.location || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleTogglePublish(s)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        s.is_published === 1
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}
                    >
                      {s.is_published === 1 ? (
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
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-stone-500 hover:text-[#064E3B] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                      title="Edit Scholar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setScholarToDelete(s)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Scholar"
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

      {/* Add / Edit Scholar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingScholar ? 'Edit Scholar Profile' : 'Add New Scholar'}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="e.g. Shaikh Ul Islam Syed Madni Miya Ashrafi"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Honorific Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={honorificTitle}
                    onChange={(e) => setHonorificTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="e.g. SHAIKH UL ISLAM"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="shaikh-ul-islam-syed-madni-miya-ashrafi"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Location / Origin
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="e.g. Kichhouchha Sharif, India"
                />
              </div>

              {/* Profile Image & Upload with Instant Visual Preview */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Scholar Profile Photo
                </label>
                <div className="flex items-center gap-4 p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-stone-200 border-2 border-[#D4AF37] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-7 h-7 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#064E3B] hover:bg-[#053d2e] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Compressing & Loading...' : 'Choose Photo from Device'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onClick={(e) => {
                            (e.target as HTMLInputElement).value = '';
                          }}
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                      {profileImage && (
                        <button
                          type="button"
                          onClick={() => setProfileImage('')}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={profileImage}
                        onChange={(e) => setProfileImage(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                        placeholder="Or paste direct image URL (https://...)"
                      />
                    </div>
                    <p className="text-[10px] text-stone-500">
                      Images are automatically resized and saved directly into the database.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Biography (Khidmaat & Ilmi Hayat)
                </label>
                <textarea
                  rows={4}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="Enter scholarly background and service..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="scholar_publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                />
                <label htmlFor="scholar_publish" className="font-semibold text-stone-800">
                  Publish profile publicly on website
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
                  {isSubmitting ? 'Saving...' : editingScholar ? 'Update Scholar' : 'Create Scholar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Scholar Modal */}
      <ConfirmDeleteModal
        isOpen={!!scholarToDelete}
        title="Delete Scholar Profile"
        message="Are you sure you want to remove this scholar? Speeches, reels, or quotations tied to this scholar will also be affected."
        itemName={scholarToDelete ? `${scholarToDelete.honorific_title} ${scholarToDelete.full_name}` : undefined}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteScholar}
        onCancel={() => setScholarToDelete(null)}
      />

    </div>
  );
};

