import React, { useState } from 'react';
import { Feather, Plus, Edit2, Trash2, Check, X, Star, AlertCircle } from 'lucide-react';
import { Shayariyan } from '../../types';
import { api } from '../../services/api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface AdminShayariyanProps {
  shayariyan: Shayariyan[];
  onRefresh: () => void;
}

export const AdminShayariyan: React.FC<AdminShayariyanProps> = ({ shayariyan, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Shayariyan | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Shayariyan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [poetName, setPoetName] = useState('');
  const [poetImage, setPoetImage] = useState('');
  const [poetryText, setPoetryText] = useState('');
  const [sharah, setSharah] = useState('');
  const [category, setCategory] = useState('Naat Shareef');
  const [language, setLanguage] = useState('Urdu');
  const [publicationDate, setPublicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setPoetName('Aala Hazrat Imam Ahmad Raza Khan');
    setPoetImage('');
    setPoetryText('');
    setSharah('');
    setCategory('Naat Shareef');
    setLanguage('Urdu');
    setPublicationDate(new Date().toISOString().split('T')[0]);
    setIsFeatured(false);
    setIsPublished(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Shayariyan) => {
    setEditingItem(item);
    setTitle(item.title);
    setPoetName(item.poet_name);
    setPoetImage(item.poet_image || '');
    setPoetryText(item.poetry_text);
    setSharah(item.sharah || '');
    setCategory(item.category || 'Naat Shareef');
    setLanguage(item.language || 'Urdu');
    setPublicationDate(item.publication_date);
    setIsFeatured(item.is_featured === 1);
    setIsPublished(item.is_published === 1);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !poetName || !poetryText) {
      setError('Title, poet name, and poetry text are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingItem) {
        await api.updateShayariyan(editingItem.id, {
          title,
          poet_name: poetName,
          poet_image: poetImage || null,
          poetry_text: poetryText,
          sharah,
          category,
          language,
          publication_date: publicationDate,
          is_featured: isFeatured ? 1 : 0,
          is_published: isPublished ? 1 : 0
        });
      } else {
        await api.createShayariyan({
          title,
          poet_name: poetName,
          poet_image: poetImage || null,
          poetry_text: poetryText,
          sharah,
          category,
          language,
          publication_date: publicationDate,
          is_featured: isFeatured ? 1 : 0,
          is_published: isPublished ? 1 : 0
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save poetry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteShayariyan(itemToDelete.id);
      setItemToDelete(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete poetry');
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            Shayariyan & Sharah Management ({shayariyan.length})
          </h2>
          <p className="text-xs text-stone-500">
            Curate devotional verses, Naat, Manqabat, and their scholarly interpretations (Sharah).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>Add Kalam & Sharah</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Poet (Shayar)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Sharah</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shayariyan.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900 max-w-xs truncate">
                    {s.title}
                  </td>
                  <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                    {s.poet_name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold text-[10px]">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {s.sharah ? (
                      <span className="text-emerald-700 font-medium">Provided</span>
                    ) : (
                      <span className="text-stone-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {s.is_featured === 1 ? (
                      <span className="inline-flex items-center gap-1 text-[#D4AF37] font-semibold text-[10px]">
                        <Star className="w-3 h-3 fill-[#D4AF37]" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span className="text-stone-400">No</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      s.is_published === 1 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {s.is_published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-stone-500 hover:text-[#064E3B] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                      title="Edit Poetry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(s)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Poetry"
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
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingItem ? 'Edit Kalam & Sharah' : 'Add New Kalam'}
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
                  Title (Kalam Ka Unwan) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="e.g. Mustafa Jane Rahmat Pe Lakho Salam"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Poet Name (Shayar) *
                  </label>
                  <input
                    type="text"
                    required
                    value={poetName}
                    onChange={(e) => setPoetName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="e.g. Imam Ahmad Raza Khan"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  >
                    <option value="Naat Shareef">Naat Shareef</option>
                    <option value="Manqabat">Manqabat-e-Awliya</option>
                    <option value="Hamd">Hamd-e-Bari Taala</option>
                    <option value="Munajaat">Munajaat</option>
                    <option value="Rohani Ghazal">Rohani Ghazal</option>
                  </select>
                </div>
              </div>

              {/* Poetry Verses in Urdu Nastaliq */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Poetry Text (Ashaar in Urdu / Roman) *
                </label>
                <textarea
                  required
                  rows={5}
                  dir="rtl"
                  value={poetryText}
                  onChange={(e) => setPoetryText(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg font-urdu text-base leading-loose focus:outline-none focus:ring-1 focus:ring-[#064E3B] bg-[#F4F8F4]"
                  placeholder="مصطفیٰ جانِ رحمت پہ لاکھوں سلام..."
                />
              </div>

              {/* Sharah (Explanation) */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Sharah (Scholarly Commentary & Explanation)
                </label>
                <textarea
                  rows={4}
                  value={sharah}
                  onChange={(e) => setSharah(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="Explain the profound spiritual and literary meanings of these verses..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="shyr_featured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                  />
                  <label htmlFor="shyr_featured" className="font-semibold text-stone-800">
                    Feature on Homepage
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="shyr_publish"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                  />
                  <label htmlFor="shyr_publish" className="font-semibold text-stone-800">
                    Publish publicly
                  </label>
                </div>
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
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Kalam' : 'Save Kalam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Poetry Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        title="Delete Kalam / Poetry"
        message="Are you sure you want to delete this poetry and its sharah? This action cannot be undone."
        itemName={itemToDelete?.title}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

    </div>
  );
};

