import React, { useState, useMemo } from 'react';
import { Volume2, Play, Search, Filter, Calendar, Clock, User, ArrowRight, Bookmark } from 'lucide-react';
import { Speech, Scholar, SpeechType } from '../types';
import { useUserAuth } from '../context/UserAuthContext';
import { resolveMediaThumbnail, isVideoMedia } from '../utils/media';

interface SpeechesPageProps {
  speeches: Speech[];
  scholars: Scholar[];
  onPlaySpeech: (speech: Speech) => void;
  navigate: (route: string, param?: string) => void;
}

export const SpeechesPage: React.FC<SpeechesPageProps> = ({
  speeches,
  scholars,
  onPlaySpeech,
  navigate
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedScholar, setSelectedScholar] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  // Extract all distinct speech types from the loaded speeches
  const availableCategories = useMemo(() => {
    const defaultTypes = ['Islahi Taqreer', 'Ilmi Taqreer', 'Seerat-un-Nabi', 'Ahle Bait wa Sahaba', 'Aqaid wa Fiqh'];
    const customTypes = speeches.map((s) => (s.speech_type || '').trim()).filter(Boolean);
    const combined = Array.from(new Set([...defaultTypes, ...customTypes]));
    return combined;
  }, [speeches]);

  const filteredSpeeches = useMemo(() => {
    return speeches
      .filter((sp) => {
        if (selectedType !== 'all') {
          const spType = (sp.speech_type || '').trim().toLowerCase();
          const targetType = selectedType.trim().toLowerCase();
          if (spType !== targetType && !spType.includes(targetType) && !targetType.includes(spType)) {
            return false;
          }
        }
        if (selectedScholar !== 'all' && sp.scholar_id !== selectedScholar) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (sp.title || '').toLowerCase().includes(q);
          const matchScholar = (sp.scholar_name || '').toLowerCase().includes(q);
          const matchTags = (sp.tags || '').toLowerCase().includes(q);
          const matchDesc = (sp.description || '').toLowerCase().includes(q);
          const matchType = (sp.speech_type || '').toLowerCase().includes(q);
          if (!matchTitle && !matchScholar && !matchTags && !matchDesc && !matchType) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'latest') {
          return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
        } else {
          return new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
        }
      });
  }, [speeches, selectedType, selectedScholar, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedScholar('all');
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-stone-200 pb-6">
        <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
          اہل سنت کی معتمد ویڈیوز و تقاریر • Audio & Video Discourses
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">
          Islamic Videos & Speeches (اسلامی ویڈیوز اور تقاریر)
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Listen to verified moral admonitions (Islahi Taqreer), in-depth academic lectures (Ilmi Taqreer), Seerat discourses, and authentic scholarly bayan by the esteemed Mashayekh of Ahl-e-Sunnat.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Interactive Speech Type Category Ribbon */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg w-full md:w-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedType === 'all'
                  ? 'bg-white text-[#064E3B] shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Categories ({speeches.length})
            </button>
            {availableCategories.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedType === type
                    ? 'bg-white text-[#064E3B] shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, scholar, category..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B] focus:border-[#064E3B]"
            />
          </div>
        </div>

        {/* Scholar Selector & Sort Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium whitespace-nowrap">Filter by Scholar:</span>
            <select
              value={selectedScholar}
              onChange={(e) => setSelectedScholar(e.target.value)}
              className="py-1 px-2.5 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            >
              <option value="all">All Respected Scholars ({scholars.length})</option>
              {scholars.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.honorific_title ? `${s.honorific_title} - ` : ''}{s.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-stone-400">
              Showing {filteredSpeeches.length} {filteredSpeeches.length === 1 ? 'speech' : 'speeches'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1 px-2.5 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-700 focus:outline-none"
            >
              <option value="latest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Speeches Grid */}
      {filteredSpeeches.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
          <Volume2 className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-semibold text-stone-700">No speeches match your criteria</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try adjusting your speech type filter, clearing your search term, or selecting a different scholar.
          </p>
          {(selectedType !== 'all' || selectedScholar !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedScholar('all');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#064E3B] bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeeches.map((speech) => (
            <div
              key={speech.id}
              onClick={() => onPlaySpeech(speech)}
              className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-md hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between group cursor-pointer"
            >
              {/* Media Thumbnail */}
              <div className="relative aspect-video bg-stone-900 flex items-center justify-center overflow-hidden">
                <img
                  src={resolveMediaThumbnail(speech.thumbnail, speech.media_url)}
                  alt={speech.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                <button
                  onClick={() => onPlaySpeech(speech)}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#D4AF37] hover:bg-[#e0bc46] text-[#064E3B] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer"
                  title={isVideoMedia(speech.media_url) ? 'Watch Video' : 'Play Speech'}
                >
                  <Play className="w-5 h-5 ml-0.5 fill-[#064E3B]" />
                </button>

                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-white rounded flex items-center gap-1">
                  {isVideoMedia(speech.media_url) ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span>Video / ویڈیو</span>
                    </>
                  ) : (
                    <span>{speech.speech_type}</span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-[#064E3B] transition-colors">
                    {speech.title}
                  </h3>

                  {speech.scholar_slug ? (
                    <button
                      onClick={() => navigate('scholar', speech.scholar_slug!)}
                      className="text-xs text-emerald-800 hover:text-emerald-900 hover:underline font-medium mt-1.5 block truncate text-left cursor-pointer"
                    >
                      {speech.scholar_title ? `${speech.scholar_title} - ` : ''}{speech.scholar_name}
                    </button>
                  ) : (
                    <p className="text-xs text-emerald-800 font-medium mt-1.5 truncate">
                      {speech.scholar_name}
                    </p>
                  )}

                  {speech.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 mt-2 leading-relaxed">
                      {speech.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{speech.upload_date}</span>
                  </span>
                  {speech.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{speech.duration}</span>
                    </span>
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
