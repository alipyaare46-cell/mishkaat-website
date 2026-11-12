import React, { useState, useMemo } from 'react';
import { Feather, Search, ChevronDown, ChevronUp, Star, Calendar, User } from 'lucide-react';
import { Shayariyan } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ShayariyanPageProps {
  shayariyan: Shayariyan[];
}

export const ShayariyanPage: React.FC<ShayariyanPageProps> = ({ shayariyan }) => {
  const { translateCategory } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    return shayariyan.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPoet = item.poet_name.toLowerCase().includes(q);
        const matchText = item.poetry_text.toLowerCase().includes(q);
        const matchSharah = (item.sharah || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPoet && !matchText && !matchSharah) return false;
      }
      return true;
    });
  }, [shayariyan, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-6">
        <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
          Kalam-e-Raza & Devotional Poetics
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">
          Shayariyan & Sharah
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Exquisite Islamic poetry, Naat-e-Rasool (peace be upon him), Manqabat-e-Awliya, and spiritual ghazals presented with authentic commentary and scholarly explanation (Sharah).
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verses, poets, or titles..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
          />
        </div>

        <span className="text-xs text-stone-400">
          {filteredItems.length} {filteredItems.length === 1 ? 'Kalam' : 'Kalams'} available
        </span>
      </div>

      {/* Poetry Gallery */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
          <Feather className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-semibold text-stone-700">No poetry records found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try a different search term or add verses in the Admin Portal.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredItems.map((item) => {
            const isExpanded = expandedIds.has(item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:border-[#D4AF37]/50 transition-all"
              >
                {/* Poetry Card Header */}
                <div className="p-6 bg-stone-50/70 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.is_featured === 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#064E3B] font-semibold text-[10px] uppercase">
                        <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                        <span>Featured Kalam</span>
                      </span>
                    )}
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                      {translateCategory(item.category || 'Naat / Manqabat')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-800" />
                      <span className="font-semibold text-stone-800">{item.poet_name}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{item.publication_date}</span>
                    </span>
                  </div>
                </div>

                {/* Poetry Verse Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900 text-center">
                    {item.title}
                  </h3>

                  {/* Urdu Nastaliq Verse Display */}
                  <div className="p-6 sm:p-8 bg-[#F4F8F4] rounded-xl border border-emerald-950/10 text-right">
                    <div className="font-urdu text-lg sm:text-2xl text-stone-800 leading-loose whitespace-pre-line">
                      {item.poetry_text}
                    </div>
                  </div>

                  {/* Sharah / Explanation Accordion Toggle */}
                  {item.sharah && (
                    <div className="pt-4 border-t border-stone-100">
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors text-xs font-semibold text-[#064E3B] cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Feather className="w-4 h-4 text-[#D4AF37]" />
                          <span>Sharah (In-depth Commentary & Meaning)</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 bg-white rounded-lg border border-stone-200 text-xs sm:text-sm leading-relaxed text-stone-700 whitespace-pre-line font-sans animate-in fade-in duration-150">
                          {item.sharah}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
