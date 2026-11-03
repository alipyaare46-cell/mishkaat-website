import React, { useState } from 'react';
import { Quote, Plus, Edit2, Trash2, Check, X, FolderPlus, AlertCircle } from 'lucide-react';
import { Aqwaal, AqwaalCategory, Scholar, AqwaalType } from '../../types';
import { api } from '../../services/api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface AdminAqwaalProps {
  aqwaal: Aqwaal[];
  categories: AqwaalCategory[];
  scholars: Scholar[];
  onRefresh: () => void;
}

export const AdminAqwaal: React.FC<AdminAqwaalProps> = ({
  aqwaal,
  categories,
  scholars,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Aqwaal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-app delete states
  const [itemToDelete, setItemToDelete] = useState<Aqwaal | null>(null);
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [text, setText] = useState('');
  const [type, setType] = useState<AqwaalType>('Aqwaal');
  const [scholarId, setScholarId] = useState('');
  const [attributedTo, setAttributedTo] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [referenceSource, setReferenceSource] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Category form states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  const openCreateModal = () => {
    setEditingItem(null);
    setText('');
    setType('Aqwaal');
    setScholarId('');
    setAttributedTo('');
    setCategoryId(categories[0]?.id || '');
    setReferenceSource('');
    setIsPublished(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Aqwaal) => {
    setEditingItem(item);
    setText(item.text);
    setType(item.type);
    setScholarId(item.scholar_id || '');
    setAttributedTo(item.attributed_to || '');
    setCategoryId(item.category_id || '');
    setReferenceSource(item.reference_source || '');
    setIsPublished(item.is_published === 1);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !type) {
      setError('Quote text and type are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingItem) {
        await api.updateAqwaal(editingItem.id, {
          text,
          type,
          scholar_id: scholarId || null,
          attributed_to: attributedTo,
          category_id: categoryId || null,
          reference_source: referenceSource,
          is_published: isPublished ? 1 : 0
        });
      } else {
        await api.createAqwaal({
          text,
          type,
          scholar_id: scholarId || null,
          attributed_to: attributedTo,
          category_id: categoryId || null,
          reference_source: referenceSource,
          is_published: isPublished ? 1 : 0
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteAqwaal(itemToDelete.id);
      setItemToDelete(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quotation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      await api.createAqwaalCategory({ name: catName, slug: catSlug });
      setIsCategoryModalOpen(false);
      setCatName('');
      setCatSlug('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    }
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteAqwaalCategory(catToDelete.id);
      setCatToDelete(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Category cannot be deleted');
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
            Aqwaal & Nasihat Management ({aqwaal.length})
          </h2>
          <p className="text-xs text-stone-500">
            Curate quotations, spiritual advice, and moral reminders with accurate scholar attribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-300 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Manage Categories ({categories.length})</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Add Maxim</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Quote / Reminder</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Attributed To</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {aqwaal.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-serif italic text-stone-900 max-w-sm truncate">
                    "{item.text}"
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold text-[10px]">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-900 font-medium whitespace-nowrap">
                    {item.scholar_name || item.attributed_to || 'General'}
                  </td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                    {item.category_name || '—'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.is_published === 1 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {item.is_published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-stone-500 hover:text-[#064E3B] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Item"
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
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingItem ? 'Edit Maxim / Nasihat' : 'Add Maxim / Nasihat'}
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
                  Type *
                </label>
                <select
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                >
                  <option value="Aqwaal">Aqwaal (Saying / Quotation)</option>
                  <option value="Nasihat">Nasihat (Spiritual Counsel / Advice)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Quotation / Reminder Text *
                </label>
                <textarea
                  required
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-serif text-sm italic"
                  placeholder="Enter wisdom text here..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Select Database Scholar (Optional)
                  </label>
                  <select
                    value={scholarId}
                    onChange={(e) => {
                      setScholarId(e.target.value);
                      if (e.target.value) setAttributedTo('');
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  >
                    <option value="">— None (or custom attribution) —</option>
                    {scholars.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Or Custom Attribution / Source
                  </label>
                  <input
                    type="text"
                    value={attributedTo}
                    onChange={(e) => setAttributedTo(e.target.value)}
                    disabled={!!scholarId}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] disabled:bg-stone-100"
                    placeholder="e.g. Sayyiduna Ali, Imam Ghazali, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  >
                    <option value="">— Select Category —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Reference Source (Book / Kitab)
                  </label>
                  <input
                    type="text"
                    value={referenceSource}
                    onChange={(e) => setReferenceSource(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="e.g. Ihya Ulum al-Din, Vol. 2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="aqwaal_publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                />
                <label htmlFor="aqwaal_publish" className="font-semibold text-stone-800">
                  Publish publicly on website
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
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Maxim' : 'Save Maxim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Manage Aqwaal Categories</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <form onSubmit={handleCreateCategory} className="space-y-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-800 block text-xs">
                  Create Aqwaal Category
                </span>
                <div>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }}
                    placeholder="Category Name (e.g. Rohaniyat)"
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="Slug (e.g. rohaniyat)"
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg font-mono focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#064E3B] text-white rounded-lg font-semibold hover:bg-[#075c46] transition-colors"
                >
                  Add Category
                </button>
              </form>

              <div>
                <span className="font-bold text-stone-800 block mb-2 text-xs uppercase tracking-wider text-stone-500">
                  Existing Categories ({categories.length})
                </span>
                <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto">
                  {categories.map((c) => (
                    <div key={c.id} className="py-2 flex items-center justify-between">
                      <span className="font-semibold text-stone-900">{c.name}</span>
                      <button
                        onClick={() => setCatToDelete({ id: c.id, name: c.name })}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Quotation / Nasihat Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        title="Delete Quotation / Nasihat"
        message="Are you sure you want to delete this quotation/reminder? This will remove it permanently."
        itemName={itemToDelete ? `"${itemToDelete.text.substring(0, 40)}..."` : undefined}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Confirm Delete Category Modal */}
      <ConfirmDeleteModal
        isOpen={!!catToDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Associated quotations will be un-categorized."
        itemName={catToDelete?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCatToDelete(null)}
      />

    </div>
  );
};

