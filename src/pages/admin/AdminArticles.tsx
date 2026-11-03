import React, { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Check, X, Upload, FolderPlus, AlertCircle, AlignRight, AlignLeft } from 'lucide-react';
import { Article, ArticleCategory } from '../../types';
import { api } from '../../services/api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface AdminArticlesProps {
  articles: Article[];
  categories: ArticleCategory[];
  onRefresh: () => void;
  onPreviewArticle: (slug: string) => void;
}

export const AdminArticles: React.FC<AdminArticlesProps> = ({
  articles,
  categories,
  onRefresh,
  onPreviewArticle
}) => {
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRtl, setIsRtl] = useState(false);

  // Form states for Article
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorName, setAuthorName] = useState('Editorial');
  const [featuredImage, setFeaturedImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [publicationDate, setPublicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Form states for Category
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const openCreateArticleModal = () => {
    setEditingArticle(null);
    setTitle('');
    setSlug('');
    setCategoryId(categories[0]?.id || '');
    setAuthorName('Mishkaat Editorial');
    setFeaturedImage('');
    setExcerpt('');
    setContent('');
    setPublicationDate(new Date().toISOString().split('T')[0]);
    setTags('');
    setIsPublished(true);
    setIsRtl(false);
    setError(null);
    setIsArticleModalOpen(true);
  };

  const openEditArticleModal = (a: Article) => {
    setEditingArticle(a);
    setTitle(a.title);
    setSlug(a.slug);
    setCategoryId(a.category_id);
    setAuthorName(a.author_name || 'Editorial');
    setFeaturedImage(a.featured_image || '');
    setExcerpt(a.excerpt || '');
    setContent(a.content);
    setPublicationDate(a.publication_date);
    setTags(a.tags || '');
    setIsPublished(a.is_published === 1);
    setIsRtl(/[\u0600-\u06FF]/.test(a.content));
    setError(null);
    setIsArticleModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticle) {
      let generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      if (!generated) {
        generated = `article-${Date.now().toString().slice(-6)}`;
      }
      setSlug(generated);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setError(null);

    try {
      const res = await api.uploadFile(file);
      setFeaturedImage(res.url);
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSlug = slug?.trim() || `article-${Date.now().toString().slice(-6)}`;
    const effectiveCategoryId = categoryId || categories[0]?.id;

    if (!title?.trim() || !content?.trim() || !effectiveCategoryId) {
      setError('Article Title, Category, and Content are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingArticle) {
        await api.updateArticle(editingArticle.id, {
          title: title.trim(),
          slug: effectiveSlug,
          category_id: effectiveCategoryId,
          author_name: authorName || 'Mishkaat Editorial',
          featured_image: featuredImage || null,
          excerpt,
          content,
          publication_date: publicationDate || new Date().toISOString().split('T')[0],
          tags,
          is_published: isPublished ? 1 : 0
        });
      } else {
        await api.createArticle({
          title: title.trim(),
          slug: effectiveSlug,
          category_id: effectiveCategoryId,
          author_name: authorName || 'Mishkaat Editorial',
          featured_image: featuredImage || null,
          excerpt,
          content,
          publication_date: publicationDate || new Date().toISOString().split('T')[0],
          tags,
          is_published: isPublished ? 1 : 0
        });
      }
      setIsArticleModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteArticle(articleToDelete.id);
      setArticleToDelete(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      await api.createArticleCategory({ name: catName, slug: catSlug, description: catDesc });
      setIsCategoryModalOpen(false);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add article category');
    }
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteArticleCategory(catToDelete.id);
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
            Articles Management ({articles.length} Essays)
          </h2>
          <p className="text-xs text-stone-500">
            Write, curate, and format research papers, Shakhsiyat biographies, and Islamic articles.
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
            onClick={openCreateArticleModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Write Article</span>
          </button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900 max-w-xs truncate">
                    {a.title}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px]">
                      {a.category_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                    {a.author_name}
                  </td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                    {a.publication_date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      a.is_published === 1 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {a.is_published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onPreviewArticle(a.slug)}
                      className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      title="Read Article"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditArticleModal(a)}
                      className="p-1.5 text-stone-500 hover:text-[#064E3B] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setArticleToDelete(a)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Article"
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

      {/* Add / Edit Article Modal */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingArticle ? 'Edit Article' : 'Write New Article'}
              </h3>
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 overflow-y-auto space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Article Title (Unwan) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="e.g. Imam Ahmad Raza Khan: Hayat Wa Khidmaat"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="imam-ahmad-raza-khan-hayat-wa-khidmaat"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Author / Contributor
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="e.g. Mufti Muhammad Aslam"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Featured Image URL / Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="https://... or upload..."
                  />
                  <label className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer border border-stone-300 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Short Excerpt / Abstract
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="A concise summary of the article..."
                />
              </div>

              {/* Content Editor with RTL toggle for Arabic/Urdu */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-700">
                    Full Article Content *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRtl(!isRtl)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                  >
                    {isRtl ? <AlignLeft className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                    <span>{isRtl ? 'Switch to LTR' : 'Switch to RTL (Urdu/Arabic)'}</span>
                  </button>
                </div>

                <textarea
                  required
                  rows={8}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] ${
                    isRtl ? 'font-urdu text-base leading-loose' : 'font-sans'
                  }`}
                  placeholder="Write the full scholarly text here..."
                />
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
                  placeholder="Seerat, Shakhsiyat, Fiqh, Ahle Sunnat"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="art_publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                />
                <label htmlFor="art_publish" className="font-semibold text-stone-800">
                  Publish article publicly (uncheck to save as draft)
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingArticle ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Manage Article Categories</h3>
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
                  Create Article Category
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
                    placeholder="Category Name (e.g. Shakhsiyat)"
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="Slug (e.g. shakhsiyat)"
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
                      <div>
                        <span className="font-semibold text-stone-900">{c.name}</span>
                        <span className="text-[10px] text-stone-400 block font-mono">{c.slug}</span>
                      </div>
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

      {/* Confirm Delete Article Modal */}
      <ConfirmDeleteModal
        isOpen={!!articleToDelete}
        title="Delete Article"
        message="Are you sure you want to delete this article? This will permanently delete the essay and its content."
        itemName={articleToDelete?.title}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteArticle}
        onCancel={() => setArticleToDelete(null)}
      />

      {/* Confirm Delete Category Modal */}
      <ConfirmDeleteModal
        isOpen={!!catToDelete}
        title="Delete Article Category"
        message="Are you sure you want to delete this category? Associated articles will be un-categorized."
        itemName={catToDelete?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCatToDelete(null)}
      />

    </div>
  );
};

