import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Download, ExternalLink, Filter } from 'lucide-react';
import { Book, BookCategory } from '../types';

interface BooksPageProps {
  books: Book[];
  categories: BookCategory[];
  onViewBook: (book: Book) => void;
}

export const BooksPage: React.FC<BooksPageProps> = ({ books, categories, onViewBook }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (selectedCategory !== 'all') {
        const selectedCatObj = categories.find((c) => c.id === selectedCategory);
        const matchId = b.category_id === selectedCategory;
        const matchName = selectedCatObj && b.category_name && b.category_name.toLowerCase() === selectedCatObj.name.toLowerCase();
        if (!matchId && !matchName) return false;
      }
      if (
        selectedLanguage !== 'all' &&
        (b.language || 'urdu').trim().toLowerCase() !== selectedLanguage.trim().toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (b.title || '').toLowerCase().includes(q);
        const matchAuthor = (b.author_name || '').toLowerCase().includes(q);
        const matchCategory = (b.category_name || '').toLowerCase().includes(q);
        const matchDesc = (b.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchCategory && !matchDesc) return false;
      }
      return true;
    });
  }, [books, categories, selectedCategory, selectedLanguage, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-stone-200 pb-6">
        <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
          Kutub Khana (Scholarly Repository)
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">
          Islamic Digital Library
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Access authoritative texts in Tafseer, Hadith sciences, Islamic jurisprudence (Fiqh), Sufi ethics (Tasawwuf), Seerat-un-Nabi, Creed (Aqeedah), and classical Urdu literature.
        </p>
      </div>

      {/* Filter and Category Ribbon */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Category Tabs (Interactive Filter Controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#064E3B] text-white shadow-xs font-bold'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            All Disciplines ({books.length})
          </button>
          {categories.map((c) => {
            const count = books.filter(
              (b) => b.category_id === c.id || (b.category_name && b.category_name.toLowerCase() === c.name.toLowerCase())
            ).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === c.id
                    ? 'bg-[#064E3B] text-white shadow-xs font-bold'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
              >
                {c.name} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-3 border-t border-stone-100 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by book title or author..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-stone-400">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
            </span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="py-1 px-2.5 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-700 focus:outline-none"
            >
              <option value="all">All Languages</option>
              <option value="Urdu">Urdu</option>
              <option value="Arabic">Arabic</option>
              <option value="English">English</option>
              <option value="Persian">Persian</option>
            </select>
          </div>
        </div>
      </div>

      {/* Book Shelves Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-semibold text-stone-700">No books found in this selection</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try choosing another category, clearing your search, or uploading books via the Admin Portal.
          </p>
          {(selectedCategory !== 'all' || searchQuery || selectedLanguage !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLanguage('all');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#064E3B] bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => onViewBook(book)}
              className="bg-white rounded-xl border border-stone-200/80 p-3.5 hover:border-[#D4AF37] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* Book Cover */}
              <div className="aspect-3/4 bg-stone-100 rounded-lg overflow-hidden relative mb-3 shadow-xs flex items-center justify-center border border-stone-100">
                {book.cover_image ? (
                  <img
                    src={book.cover_image}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center p-3 text-stone-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-1 text-[#064E3B]/40" />
                    <span className="text-[10px] font-serif text-stone-500">Mishkaat</span>
                  </div>
                )}
                {book.allow_download === 1 && (
                  <span className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white" title="PDF Available">
                    <Download className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Book Info */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold block truncate">
                  {book.category_name}
                </span>
                <h3 className="text-xs font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-[#064E3B] transition-colors">
                  {book.title}
                </h3>
                <p className="text-[11px] text-stone-500 truncate">
                  {book.author_name}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                <span>{book.language || 'Urdu'}</span>
                <span className="font-semibold text-emerald-800 group-hover:underline">
                  View Book →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
