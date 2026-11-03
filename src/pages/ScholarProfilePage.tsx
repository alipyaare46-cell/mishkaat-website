import React, { useState, useEffect } from 'react';
import { Users, Volume2, Film, Play, MapPin, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Scholar, Speech, Reel } from '../types';
import { api } from '../services/api';

interface ScholarProfilePageProps {
  slug: string;
  onBack: () => void;
  onPlaySpeech: (speech: Speech) => void;
  onPlayReel: (reel: Reel) => void;
}

export const ScholarProfilePage: React.FC<ScholarProfilePageProps> = ({
  slug,
  onBack,
  onPlaySpeech,
  onPlayReel
}) => {
  const [scholar, setScholar] = useState<Scholar | null>(null);
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeTab, setActiveTab] = useState<'speeches' | 'reels'>('speeches');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api.getScholarDetail(slug)
      .then((data) => {
        if (isMounted) {
          setScholar(data.scholar);
          // Only speeches and reels strictly assigned to this scholar
          setSpeeches(data.speeches);
          setReels(data.reels);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Scholar profile not found');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#064E3B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-stone-500">Loading scholar profile and archives...</p>
      </div>
    );
  }

  if (error || !scholar) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Users className="w-12 h-12 text-stone-300 mx-auto" />
        <h2 className="text-lg font-bold text-stone-800">Scholar Profile Not Found</h2>
        <p className="text-xs text-stone-500">
          The requested scholar profile could not be retrieved from the database.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#064E3B] rounded-lg cursor-pointer"
        >
          Return to Scholars
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </button>

      {/* Scholar Header Profile Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Scholar Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-stone-100 border-2 border-[#D4AF37]/50 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
            {scholar.profile_image ? (
              <img
                src={scholar.profile_image}
                alt={scholar.full_name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className="w-12 h-12 text-[#064E3B]/60" />
            )}
          </div>

          {/* Scholar Bio & Titles */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold block">
              {scholar.honorific_title}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
              {scholar.full_name}
            </h1>

            {scholar.location && (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                <span>{scholar.location}</span>
              </div>
            )}

            {scholar.biography ? (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-2 font-sans">
                {scholar.biography}
              </p>
            ) : (
              <p className="text-xs text-stone-400 italic pt-2">
                Verified scholarly biography awaiting administrative submission.
              </p>
            )}

            {/* Quick Metrics */}
            <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-6 text-xs text-stone-500">
              <span className="font-semibold text-stone-900">
                {speeches.length} <span className="font-normal text-stone-500">Speeches</span>
              </span>
              <span>·</span>
              <span className="font-semibold text-stone-900">
                {reels.length} <span className="font-normal text-stone-500">Reels</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Content Tabs (Speeches / Reels) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('speeches')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'speeches'
                ? 'border-[#064E3B] text-[#064E3B]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Dedicated Speeches ({speeches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reels'
                ? 'border-[#064E3B] text-[#064E3B]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Dedicated Reels ({reels.length})</span>
          </button>
        </div>

        {/* Tab 1: Speeches strictly assigned to this scholar */}
        {activeTab === 'speeches' && (
          <div>
            {speeches.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-2">
                <Volume2 className="w-10 h-10 text-stone-300 mx-auto" />
                <h4 className="text-sm font-semibold text-stone-700">No speeches linked to this scholar yet</h4>
                <p className="text-xs text-stone-400">
                  Speeches assigned to this scholar will automatically appear here when published.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {speeches.map((sp) => (
                  <div
                    key={sp.id}
                    onClick={() => onPlaySpeech(sp)}
                    className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="relative aspect-video bg-stone-900 flex items-center justify-center overflow-hidden">
                      {sp.thumbnail ? (
                        <img
                          src={sp.thumbnail}
                          alt={sp.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#064E3B]/80 flex items-center justify-center">
                          <Volume2 className="w-10 h-10 text-white/50" />
                        </div>
                      )}

                      <button
                        onClick={() => onPlaySpeech(sp)}
                        className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#D4AF37] hover:bg-[#e0bc46] text-[#064E3B] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer"
                        title="Play speech"
                      >
                        <Play className="w-5 h-5 ml-0.5 fill-[#064E3B]" />
                      </button>

                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-[10px] font-semibold text-white rounded">
                        {sp.speech_type}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-[#064E3B] transition-colors">
                        {sp.title}
                      </h3>

                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{sp.upload_date}</span>
                        </span>
                        {sp.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{sp.duration}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reels strictly assigned to this scholar */}
        {activeTab === 'reels' && (
          <div>
            {reels.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-2">
                <Film className="w-10 h-10 text-stone-300 mx-auto" />
                <h4 className="text-sm font-semibold text-stone-700">No reels linked to this scholar yet</h4>
                <p className="text-xs text-stone-400">
                  Vertical reels assigned to this scholar will automatically appear here when published.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {reels.map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => onPlayReel(reel)}
                    className="relative aspect-9/16 bg-stone-900 rounded-xl overflow-hidden cursor-pointer group border border-stone-200 hover:border-[#D4AF37] hover:shadow-lg transition-all"
                  >
                    {reel.thumbnail ? (
                      <img
                        src={reel.thumbnail}
                        alt={reel.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#064E3B]/80 flex items-center justify-center">
                        <Film className="w-8 h-8 text-white/50" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-3">
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                        {reel.title}
                      </h4>
                      {reel.duration && (
                        <span className="text-[10px] text-stone-400 mt-1 block">
                          {reel.duration}
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#D4AF37] text-[#064E3B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 ml-0.5 fill-[#064E3B]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
