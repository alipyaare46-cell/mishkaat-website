import React, { useState, useMemo } from 'react';
import { Film, Play, Search, User, Filter, ArrowRight } from 'lucide-react';
import { Reel, Scholar } from '../types';

interface ReelsPageProps {
  reels: Reel[];
  scholars: Scholar[];
  onPlayReel: (reel: Reel) => void;
  navigate: (route: string, param?: string) => void;
}

export const ReelsPage: React.FC<ReelsPageProps> = ({
  reels,
  scholars,
  onPlayReel,
  navigate
}) => {
  const [selectedTopic, setSelectedTopic] = useState<'all' | 'madina' | 'dunya' | 'scholars'>('all');
  const [selectedScholar, setSelectedScholar] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReels = useMemo(() => {
    return reels.filter((r) => {
      // Topic Tab filter
      if (selectedTopic === 'madina') {
        const isMadina =
          r.scholar_id === 'sch-madina-sharif' ||
          r.title.toLowerCase().includes('madina') ||
          (r.description || '').toLowerCase().includes('madina') ||
          (r.scholar_name || '').toLowerCase().includes('madina') ||
          r.title.toLowerCase().includes('ziyarat') ||
          r.title.toLowerCase().includes('roza');
        if (!isMadina) return false;
      } else if (selectedTopic === 'dunya') {
        const isDunya =
          r.scholar_id === 'sch-dunya-akhirat' ||
          r.title.toLowerCase().includes('dunya') ||
          r.title.toLowerCase().includes('akhirat') ||
          r.title.toLowerCase().includes('maut') ||
          r.title.toLowerCase().includes('qabr') ||
          (r.description || '').toLowerCase().includes('akhirat') ||
          (r.scholar_name || '').toLowerCase().includes('akhirat');
        if (!isDunya) return false;
      } else if (selectedTopic === 'scholars') {
        const isGeneral = r.scholar_id === 'sch-madina-sharif' || r.scholar_id === 'sch-dunya-akhirat' || r.scholar_id === 'sch-general-islam';
        if (isGeneral) return false;
      }

      // Individual Scholar filter
      if (selectedScholar !== 'all' && r.scholar_id !== selectedScholar) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchScholar = (r.scholar_name || '').toLowerCase().includes(q);
        const matchDesc = (r.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchScholar && !matchDesc) return false;
      }
      return true;
    });
  }, [reels, selectedTopic, selectedScholar, searchQuery]);

  return (
    <div className="bg-[#101510] text-white min-h-[85vh] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">
              Short Spiritual Admonitions & Visual Reminders
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Islamic Vertical Reels (شارٹس و ریلز)
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-2xl leading-relaxed">
              Explore Madina Munawwarah ziyarat, Dunya wa Akhirat reflections, and profound scholarly excerpts in high-definition vertical 9:16 format.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400 font-mono">
              {filteredReels.length} {filteredReels.length === 1 ? 'Reel' : 'Reels'}
            </span>
          </div>
        </div>

        {/* Topic Filter Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Reels (تمام ریلز)' },
            { id: 'madina', label: 'Madina Sharif & Ziyarat (مدینہ منورہ)' },
            { id: 'dunya', label: 'Dunya Aur Akhirat (دنیا و آخرت کی فکر)' },
            { id: 'scholars', label: 'Scholars Speeches (علمائے کرام)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTopic(tab.id as any);
                if (tab.id !== 'scholars' && tab.id !== 'all') {
                  setSelectedScholar('all');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                selectedTopic === tab.id
                  ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 scale-102'
                  : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-stone-400 font-medium whitespace-nowrap">Channel / Scholar:</span>
            <select
              value={selectedScholar}
              onChange={(e) => setSelectedScholar(e.target.value)}
              className="py-1.5 px-3 bg-stone-900 border border-white/20 rounded-lg text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] w-full sm:w-64 cursor-pointer"
            >
              <option value="all">All Channels & Scholars ({scholars.length})</option>
              {scholars.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.honorific_title ? `${s.honorific_title} - ` : ''}{s.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reels by title or topic..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-900 border border-white/20 rounded-lg text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
        </div>

        {/* Vertical 9:16 Video Grid */}
        {filteredReels.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white/5 border border-white/10 rounded-2xl">
            <Film className="w-12 h-12 text-stone-500 mx-auto" />
            <h3 className="text-base font-semibold text-stone-300">No reels found</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              No vertical reels currently match the selected filter. Administrators can upload new reels in the Admin Portal.
            </p>
            {(selectedScholar !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedScholar('all');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 text-xs font-semibold text-[#064E3B] bg-[#D4AF37] hover:bg-[#e0bc46] rounded-md transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredReels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => onPlayReel(reel)}
                className="relative aspect-9/16 bg-stone-900 rounded-xl overflow-hidden cursor-pointer group border border-white/10 hover:border-[#D4AF37]/80 hover:shadow-xl transition-all"
              >
                {reel.thumbnail ? (
                  <img
                    src={reel.thumbnail}
                    alt={reel.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-[#064E3B]/80 flex items-center justify-center">
                    <Film className="w-10 h-10 text-white/40" />
                  </div>
                )}

                {/* Dark gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-between p-3.5">
                  <div className="flex justify-between items-start">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white/90">
                      {reel.duration || 'Short'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {reel.scholar_name && (
                      <p className="text-[11px] font-semibold text-[#D4AF37] truncate">
                        {reel.scholar_name}
                      </p>
                    )}
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-emerald-300 transition-colors">
                      {reel.title}
                    </h4>
                  </div>
                </div>

                {/* Hover Play Button */}
                <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#D4AF37] text-[#064E3B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl">
                  <Play className="w-5 h-5 ml-0.5 fill-[#064E3B]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
