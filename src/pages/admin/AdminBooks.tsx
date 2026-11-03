import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Check, X, Upload, Download, ExternalLink, AlertCircle, FolderPlus } from 'lucide-react';
import { Book, BookCategory } from '../../types';
import { api } from '../../services/api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface AdminBooksProps {
  books: Book[];
  categories: BookCategory[];
  onRefresh: () => void;
  onViewBook: (book: Book) => void;
}

export const AdminBooks: React.FC<AdminBooksProps> = ({
  books,
  categories,
  onRefresh,
  onViewBook
}) => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [uploadedPdfName, setUploadedPdfName] = useState('');
  const [uploadedPdfSize, setUploadedPdfSize] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Book
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('Urdu');
  const [fileUrl, setFileUrl] = useState('');
  const [externalReadUrl, setExternalReadUrl] = useState('');
  const [publicationDetails, setPublicationDetails] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  // Form states for Category
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const openCreateBookModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthorName('');
    setCategoryId(categories[0]?.id || '');
    setCoverImage('');
    setDescription('');
    setLanguage('Urdu');
    setFileUrl('');
    setExternalReadUrl('');
    setPublicationDetails('');
    setAllowDownload(true);
    setIsPublished(true);
    setPdfUploadProgress(0);
    setUploadedPdfName('');
    setUploadedPdfSize('');
    setError(null);
    setIsBookModalOpen(true);
  };

  const openEditBookModal = (b: Book) => {
    setEditingBook(b);
    setTitle(b.title);
    setAuthorName(b.author_name);
    setCategoryId(b.category_id);
    setCoverImage(b.cover_image || '');
    setDescription(b.description || '');
    setLanguage(b.language || 'Urdu');
    setFileUrl(b.file_url || '');
    setExternalReadUrl(b.external_read_url || '');
    setPublicationDetails(b.publication_details || '');
    setAllowDownload(b.allow_download === 1);
    setIsPublished(b.is_published === 1);
    setPdfUploadProgress(0);
    setUploadedPdfName(b.file_url ? b.file_url.split('/').pop() || '' : '');
    setUploadedPdfSize('');
    setError(null);
    setIsBookModalOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    setError(null);

    try {
      const res = await api.uploadFile(file);
      setCoverImage(res.url);
    } catch (err: any) {
      setError(err.message || 'Cover upload failed');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    setPdfUploadProgress(0);
    setUploadedPdfName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedPdfSize(`${sizeInMb} MB`);
    setError(null);

    try {
      const res = await api.uploadFile(file, (percent) => {
        setPdfUploadProgress(percent);
      });
      setFileUrl(res.url);
      setPdfUploadProgress(100);
    } catch (err: any) {
      setError(err.message || 'PDF upload failed. Please ensure file is valid PDF format.');
      setUploadedPdfName('');
      setUploadedPdfSize('');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleTogglePublish = async (book: Book) => {
    try {
      const nextStatus = book.is_published === 1 ? 0 : 1;
      await api.updateBook(book.id, {
        title: book.title,
        author_name: book.author_name,
        category_id: book.category_id,
        cover_image: book.cover_image,
        description: book.description,
        language: book.language,
        file_url: book.file_url,
        external_read_url: book.external_read_url,
        publication_details: book.publication_details,
        allow_download: book.allow_download,
        is_published: nextStatus
      });
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update publish status');
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !authorName || !categoryId) {
      setError('Title, author, and category are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingBook) {
        await api.updateBook(editingBook.id, {
          title,
          author_name: authorName,
          category_id: categoryId,
          cover_image: coverImage || null,
          description,
          language,
          file_url: fileUrl || null,
          external_read_url: externalReadUrl || null,
          publication_details: publicationDetails,
          allow_download: allowDownload ? 1 : 0,
          is_published: isPublished ? 1 : 0
        });
      } else {
        await api.createBook({
          title,
          author_name: authorName,
          category_id: categoryId,
          cover_image: coverImage || null,
          description,
          language,
          file_url: fileUrl || null,
          external_read_url: externalReadUrl || null,
          publication_details: publicationDetails,
          allow_download: allowDownload ? 1 : 0,
          is_published: isPublished ? 1 : 0
        });
      }
      setIsBookModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save book');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteBook(bookToDelete.id);
      setBookToDelete(null);
      onRefresh();
    } catch (err: any) {
      setError(`Deletion error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      await api.createBookCategory({ name: catName, slug: catSlug, description: catDesc });
      setIsCategoryModalOpen(false);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    }
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteBookCategory(catToDelete.id);
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
            Digital Library Management ({books.length} Books)
          </h2>
          <p className="text-xs text-stone-500">
            Manage Kutub across Quran, Hadees, Fiqh, Tasawwuf, Tareekh, and Urdu literature.
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
            onClick={openCreateBookModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Author (Musannif)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Download</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {books.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900 max-w-xs truncate">
                    {b.title}
                  </td>
                  <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                    {b.author_name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px]">
                      {b.category_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                    {b.language || 'Urdu'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {b.allow_download === 1 ? (
                      <span className="text-emerald-700 font-medium">Allowed</span>
                    ) : (
                      <span className="text-amber-700 font-medium">Read Only</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(b)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-xs ${
                        b.is_published === 1
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                      }`}
                      title={b.is_published === 1 ? 'Click to make Draft' : 'Click to make Live in Library'}
                    >
                      {b.is_published === 1 ? '✓ Published (Live)' : '⏳ Draft (Hidden)'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onViewBook(b)}
                      className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditBookModal(b)}
                      className="p-1.5 text-stone-500 hover:text-[#064E3B] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                      title="Edit Book"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setBookToDelete(b)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Book"
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

      {/* Add / Edit Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-4 bg-[#064E3B] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingBook ? 'Edit Book Details' : 'Add New Book'}
              </h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 overflow-y-auto space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Book Title (Kitab Ka Naam) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="e.g. Al-Dawlat al-Makkiya"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Author / Musannif *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="e.g. Imam Ahmad Raza Khan"
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

              {/* Cover Image */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Cover Image URL / Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="https://... or upload image..."
                  />
                  <label className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer border border-stone-300 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingCover ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={handleCoverUpload}
                      className="hidden"
                      disabled={isUploadingCover}
                    />
                  </label>
                </div>
              </div>

              {/* PDF File */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-stone-700">
                    Authorized PDF File *
                  </label>
                  <span className="text-[10px] text-stone-500 font-semibold">
                    Upload up to several GBs supported, or Paste Link URL
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="PDF URL or choose device file below..."
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer border border-stone-300 shrink-0 font-medium">
                    <Upload className="w-3.5 h-3.5 text-[#064E3B]" />
                    <span>{isUploadingPdf ? `Uploading ${pdfUploadProgress}%` : 'Upload PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={handlePdfUpload}
                      className="hidden"
                      disabled={isUploadingPdf}
                    />
                  </label>
                </div>

                {/* Real-time PDF Progress Bar */}
                {isUploadingPdf && (
                  <div className="mt-2 p-2.5 bg-stone-100 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-stone-700">
                      <span className="truncate">Uploading: {uploadedPdfName} {uploadedPdfSize && `(${uploadedPdfSize})`}</span>
                      <span className="text-[#064E3B] font-bold">{pdfUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-stone-300 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#064E3B] h-full transition-all duration-150"
                        style={{ width: `${pdfUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Uploaded PDF info banner */}
                {fileUrl && !isUploadingPdf && (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">
                        {uploadedPdfName ? `Attached: ${uploadedPdfName}` : 'PDF Linked & Ready'}
                      </span>
                      {uploadedPdfSize && <span className="text-[10px] text-emerald-600">({uploadedPdfSize})</span>}
                    </div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
                    >
                      Preview PDF ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    External Reading URL (Archive.org, etc.)
                  </label>
                  <input
                    type="text"
                    value={externalReadUrl}
                    onChange={(e) => setExternalReadUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="https://archive.org/details/..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    placeholder="Urdu / Arabic / English"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Publication / Maktaba Details
                </label>
                <input
                  type="text"
                  value={publicationDetails}
                  onChange={(e) => setPublicationDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="e.g. Maktabat-ul-Madina, Karachi (1428 AH)"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Description / Overview (Khulasa)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                  placeholder="Summary of contents and research scope..."
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_dl"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                  />
                  <label htmlFor="allow_dl" className="font-semibold text-stone-800">
                    Allow authorized public PDF downloads
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="book_publish"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-[#064E3B] rounded focus:ring-[#064E3B]"
                  />
                  <label htmlFor="book_publish" className="font-semibold text-stone-800">
                    Publish book in public library
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingBook ? 'Update Book' : 'Publish Book'}
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
              <h3 className="text-sm font-bold">Manage Book Categories</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Add category form */}
              <form onSubmit={handleCreateCategory} className="space-y-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-800 block text-xs">
                  Create New Category
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
                    placeholder="Category Name (e.g. Fiqh)"
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="Slug (e.g. fiqh)"
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

              {/* Categories list */}
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
                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
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

      {/* In-App Confirmation Modal for Book Deletion */}
      <ConfirmDeleteModal
        isOpen={!!bookToDelete}
        title="Delete Book?"
        itemName={bookToDelete?.title}
        message="This book will be permanently removed from the digital library shelves. Are you sure you want to proceed?"
        isDeleting={isDeleting}
        onConfirm={confirmDeleteBook}
        onCancel={() => setBookToDelete(null)}
      />

      {/* In-App Confirmation Modal for Category Deletion */}
      <ConfirmDeleteModal
        isOpen={!!catToDelete}
        title="Delete Category?"
        itemName={catToDelete?.name}
        message="Delete this book category? (Only categories without existing books can be removed)."
        isDeleting={isDeleting}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
};
