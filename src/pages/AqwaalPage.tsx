import React, { useState, useMemo } from 'react';
import { Quote, Search, Filter, BookOpen } from 'lucide-react';
import { Aqwaal, AqwaalCategory, AqwaalType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AqwaalPageProps {
  aqwaal: Aqwaal[];
  categories: AqwaalCategory[];
}

export const AqwaalPage: React.FC<AqwaalPageProps> = ({ aqwaal, categories }) => {
  const { language, translateCategory } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAqwaal = useMemo(() => {
    return aqwaal.filter((item) => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = item.text.toLowerCase().includes(q);
        const matchScholar = (item.scholar_name || '').toLowerCase().includes(q);
        const matchAttr = (item.attributed_to || '').toLowerCase().includes(q);
        const matchRef = (item.reference_source || '').toLowerCase().includes(q);
        if (!matchText && !matchScholar && !matchAttr && !matchRef) return false;
      }
      return true;
    });
  }, [aqwaal, selectedType, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-6">
        <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
          Hikam & Mawaiz (Spiritual Maxims)
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">
          Aqwaal & Spiritual Nasihat
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Ponder upon timeless wisdom, verified quotations (Aqwaal), and heartfelt spiritual counsels (Nasihat) to awaken the heart and illuminate daily life.
        </p>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          {/* Segmented Type Controls */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedType === 'all'
                  ? 'bg-white text-[#064E3B] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Maxims ({aqwaal.length})
            </button>
            <button
              onClick={() => setSelectedType('Aqwaal')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedType === 'Aqwaal'
                  ? 'bg-white text-[#064E3B] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Aqwaal (Quotes)
            </button>
            <button
              onClick={() => setSelectedType('Nasihat')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedType === 'Nasihat'
                  ? 'bg-white text-[#064E3B] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Nasihat (Counsel)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wisdom, scholar, reference..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>
        </div>

        {/* Categories selector */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-stone-100 text-xs overflow-x-auto pb-1">
            <span className="text-stone-500 font-medium whitespace-nowrap">
              {language === 'ur' ? 'موضوع / زمرہ:' : language === 'ar' ? 'الموضوع:' : 'Category:'}
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-emerald-100/70 text-emerald-900 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {language === 'ur' ? 'تمام موضوعات' : language === 'ar' ? 'جميع الموضوعات' : 'All Topics'}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'bg-emerald-100/70 text-emerald-900 font-semibold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {translateCategory(c.name)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aqwaal Grid */}
      {filteredAqwaal.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
          <Quote className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-semibold text-stone-700">No records found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try adjusting your search criteria or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAqwaal.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-stone-200/80 p-6 flex flex-col justify-between hover:border-[#D4AF37]/60 hover:shadow-md transition-all relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3 text-[11px] text-stone-400">
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-[#064E3B] font-semibold text-[10px] uppercase tracking-wider">
                    {q.type}
                  </span>
                  {q.category_name && (
                    <span className="text-stone-500 font-medium">{translateCategory(q.category_name)}</span>
                  )}
                </div>

                <Quote className="w-7 h-7 text-[#D4AF37]/40 mb-2" />
                <p className="text-sm sm:text-base font-serif italic text-stone-800 leading-relaxed">
                  "{q.text}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-end justify-between text-xs">
                <div>
                  <div className="font-bold text-[#064E3B]">
                    {q.scholar_name || q.attributed_to || 'Spiritual Admonition'}
                  </div>
                  {q.reference_source && (
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Source: {q.reference_source}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
