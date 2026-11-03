import React, { useState, useEffect } from 'react';
import { Search, X, Volume2, Film, BookOpen, FileText, Quote, Feather, User } from 'lucide-react';
import { api } from '../services/api';
import { Scholar, Speech, Reel, Book, Article, Aqwaal, Shayariyan } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (type: string, idOrSlug: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    scholars: Scholar[];
    speeches: Speech[];
    reels: Reel[];
    books: Book[];
    articles: Article[];
    aqwaal: Aqwaal[];
    shayariyan: Shayariyan[];
  }>({
    scholars: [],
    speeches: [],
    reels: [],
    books: [],
    articles: [],
    aqwaal: [],
    shayariyan: []
  });

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({
        scholars: [],
        speeches: [],
        reels: [],
        books: [],
        articles: [],
        aqwaal: [],
        shayariyan: []
      });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({
        scholars: [],
        speeches: [],
        reels: [],
        books: [],
        articles: [],
        aqwaal: [],
        shayariyan: []
      });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.searchGlobal(query);
        setResults(res);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.scholars.length +
    results.speeches.length +
    results.reels.length +
    results.books.length +
    results.articles.length +
    results.aqwaal.length +
    results.shayariyan.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-emerald-950/20 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-800 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search speeches, scholars, reels, books, articles, quotes, poetry..."
            className="flex-1 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-stone-400 hover:text-stone-600 text-xs px-2 py-1 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading && (
            <div className="py-8 text-center text-xs text-stone-500">
              Searching knowledge repository...
            </div>
          )}

          {!isLoading && query.trim().length >= 2 && totalResults === 0 && (
            <div className="py-10 text-center space-y-1">
              <p className="text-sm font-medium text-stone-700">No records found for "{query}"</p>
              <p className="text-xs text-stone-500">
                Try searching by scholar name, topic keyword, or title.
              </p>
            </div>
          )}

          {/* Scholars Section */}
          {results.scholars.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Scholars ({results.scholars.length})</span>
              </div>
              <div className="divide-y divide-stone-100">
                {results.scholars.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectResult('scholar', s.slug)}
                    className="w-full text-left py-2.5 px-3 hover:bg-stone-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-900 group-hover:text-emerald-800">
                        {s.full_name}
                      </div>
                      <div className="text-[11px] text-stone-500">{s.honorific_title}</div>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View Profile →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Speeches Section */}
          {results.speeches.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold mb-2 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Speeches ({results.speeches.length})</span>
              </div>
              <div className="divide-y divide-stone-100">
                {results.speeches.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => onSelectResult('speech', sp.id)}
                    className="w-full text-left py-2.5 px-3 hover:bg-stone-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-900 group-hover:text-emerald-800">
                        {sp.title}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {sp.scholar_name} · {sp.speech_type}
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-medium">Listen / Watch</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reels Section */}
          {results.reels.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold mb-2 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                <span>Islamic Reels ({results.reels.length})</span>
              </div>
              <div className="divide-y divide-stone-100">
                {results.reels.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onSelectResult('reel', r.id)}
                    className="w-full text-left py-2.5 px-3 hover:bg-stone-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-900 group-hover:text-emerald-800">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-stone-500">{r.scholar_name}</div>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-medium">Watch Reel</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Books Section */}
          {results.books.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Books ({results.books.length})</span>
              </div>
              <div className="divide-y divide-stone-100">
                {results.books.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelectResult('book', b.id)}
                    className="w-full text-left py-2.5 px-3 hover:bg-stone-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-900 group-hover:text-emerald-800">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {b.author_name} · {b.category_name}
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-medium">Read Book</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Articles Section */}
          {results.articles.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Articles ({results.articles.length})</span>
              </div>
              <div className="divide-y divide-stone-100">
                {results.articles.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectResult('article', a.slug)}
                    className="w-full text-left py-2.5 px-3 hover:bg-stone-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-900 group-hover:text-emerald-800">
                        {a.title}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {a.author_name} · {a.category_name}
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-medium">Read Article</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aqwaal Section */}
          {results.aqwaal.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold mb-2 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" />
                <span>Aqwaal & Nasihat ({results.aqwaal.length})</span>
              </div>
              <div className="divide-y divide-stone-100">
                {results.aqwaal.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => onSelectResult('aqwaal', q.id)}
                    className="w-full text-left py-2.5 px-3 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="text-xs text-stone-800 line-clamp-2 italic">
                      "{q.text}"
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      {q.scholar_name || q.attributed_to || 'Spiritual Nasihat'} ({q.type})
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shayariyan Section */}
          {results.shayariyan.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold mb-2 flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5" />
                <span>Shayariyan ({results.shayariyan.length})</span>
              </div>
              <div className="divide-y divide-stone-100">
                {results.shayariyan.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectResult('shayariyan', s.id)}
                    className="w-full text-left py-2.5 px-3 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-stone-900 group-hover:text-emerald-800">
                      {s.title} — {s.poet_name}
                    </div>
                    <div className="text-xs text-stone-600 line-clamp-1 font-urdu mt-0.5">
                      {s.poetry_text}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-right text-[11px] text-stone-400">
          Press ESC to dismiss
        </div>
      </div>
    </div>
  );
};
