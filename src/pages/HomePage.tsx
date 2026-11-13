import React from 'react';
import { Volume2, Film, BookOpen, FileText, Quote, Feather, Users, ArrowRight, Play, ExternalLink, Calendar, Clock, Bookmark } from 'lucide-react';
import { Scholar, Speech, Reel, Book, Article, Aqwaal, Shayariyan, WebsiteSettings, WebsiteStats } from '../types';
import madinahHeroImg from '../assets/images/madinah_munawwarah_hero_1793189667524.jpg';
import emblemImg from '../assets/images/mishkaat_logo_emblem_1794552300053.jpg';
import { useLanguage } from '../context/LanguageContext';
import { useUserAuth } from '../context/UserAuthContext';
import { resolveMediaThumbnail, isVideoMedia } from '../utils/media';

interface HomePageProps {
  settings: WebsiteSettings | null;
  stats: WebsiteStats | null;
  scholars: Scholar[];
  speeches: Speech[];
  reels: Reel[];
  books: Book[];
  articles: Article[];
  aqwaal: Aqwaal[];
  shayariyan: Shayariyan[];
  navigate: (route: string, param?: string) => void;
  onPlaySpeech: (speech: Speech) => void;
  onPlayReel: (reel: Reel) => void;
  onViewBook: (book: Book) => void;
  onReadArticle: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  stats,
  scholars,
  speeches,
  reels,
  books,
  articles,
  aqwaal,
  shayariyan,
  navigate,
  onPlaySpeech,
  onPlayReel,
  onViewBook,
  onReadArticle
}) => {
  const { t, language, translateScholar, translateCategory } = useLanguage();
  const { toggleBookmark, isBookmarked } = useUserAuth();

  // Respect settings visibility toggles
  const showHeroCta = settings?.show_hero_cta !== 'false';
  const showStats = settings?.show_stats_dashboard !== 'false';
  const showScholars = settings?.show_featured_scholars !== 'false';
  const showSpeeches = settings?.show_latest_speeches !== 'false';
  const showReels = settings?.show_reels_section !== 'false';
  const showBooks = settings?.show_featured_books !== 'false';
  const showArticles = settings?.show_articles_section !== 'false';
  const showAqwaal = settings?.show_aqwaal_section !== 'false';
  const showShayariyan = settings?.show_shayariyan_section !== 'false';

  return (
    <div className="space-y-16 pb-20">
      
      {/* ------------------------------------------------------------- */}
      {/* 3.A: WELCOME HERO SECTION (Madinah Munawwarah Background) */}
      {/* ------------------------------------------------------------- */}
      <section className="relative bg-[#064E3B] text-white overflow-hidden border-b border-[#064E3B]/80 min-h-[460px] flex items-center">
        {/* Madinah Munawwarah Background Image & Serene Emerald Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={madinahHeroImg}
            alt="Madinah Munawwarah - Masjid an-Nabawi"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000"
          />
          {/* Subtle multi-stop gradient allowing the green dome & minarets to show prominently while keeping text perfectly legible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#064E3B]/95 via-[#064E3B]/85 to-[#064E3B]/60" />
          <div className="absolute inset-0 bg-black/25 mix-blend-multiply" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-black/30 border border-[#D4AF37]/50 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wider backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span>{t.welcomeSubtitle}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
              {language === 'en' ? (settings?.welcome_title || t.welcomeTitle) : t.welcomeTitle}
            </h1>

            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed font-sans max-w-2xl drop-shadow-sm">
              {language === 'en' ? (settings?.welcome_message || t.welcomeDesc) : t.welcomeDesc}
            </p>

            {/* Quick Access Action Buttons */}
            {showHeroCta && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('speeches')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#064E3B] bg-[#D4AF37] hover:bg-[#e0bc46] rounded-lg shadow-md transition-all duration-150 cursor-pointer active:scale-95"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{t.exploreSpeeches}</span>
                </button>

                <button
                  onClick={() => navigate('books')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-black/40 hover:bg-black/60 border border-white/30 rounded-lg backdrop-blur-md transition-all duration-150 cursor-pointer active:scale-95"
                >
                  <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.exploreBooks}</span>
                </button>

                <button
                  onClick={() => navigate('reels')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-black/40 hover:bg-black/60 border border-white/30 rounded-lg backdrop-blur-md transition-all duration-150 cursor-pointer active:scale-95"
                >
                  <Film className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.exploreReels}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3.B: WEBSITE STATISTICS DASHBOARD (Live auto-calculated from DB) */}
      {/* ------------------------------------------------------------- */}
      {showStats && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-20">
          <div className="bg-white rounded-xl shadow-lg border border-stone-200/80 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-[11px] uppercase tracking-widest text-[#064E3B] font-bold">
                {t.liveStatsTitle}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {t.realtimeUpdate}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: t.totalSpeeches, count: stats?.published.speeches ?? 0, icon: Volume2, route: 'speeches' },
                { label: t.totalReels, count: stats?.published.reels ?? 0, icon: Film, route: 'reels' },
                { label: t.totalBooks, count: stats?.published.books ?? 0, icon: BookOpen, route: 'books' },
                { label: t.totalArticles, count: stats?.published.articles ?? 0, icon: FileText, route: 'articles' },
                { label: t.totalAqwaal, count: stats?.published.aqwaal ?? 0, icon: Quote, route: 'aqwaal' },
                { label: t.totalShayariyan, count: stats?.published.shayariyan ?? 0, icon: Feather, route: 'shayariyan' },
                { label: t.totalScholars, count: stats?.published.scholars ?? 0, icon: Users, route: 'speeches' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(item.route)}
                    className="p-3 rounded-lg bg-stone-50 hover:bg-[#F4F8F4] border border-stone-200/60 hover:border-[#D4AF37]/40 transition-all text-left group cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-[#064E3B] mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900 tabular-nums">
                      {item.count}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.C: FEATURED SCHOLARS */}
      {/* ------------------------------------------------------------- */}
      {showScholars && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
                {t.scholarsSubtitle}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                {t.featuredScholars}
              </h2>
            </div>
            <button
              onClick={() => navigate('speeches')}
              className="text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t.exploreAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholars.slice(0, 6).map((scholar) => {
              const sTrans = translateScholar(scholar);
              return (
              <div
                key={scholar.id}
                className="bg-white rounded-xl border border-stone-200/80 p-5 hover:border-[#D4AF37]/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden text-[#064E3B]">
                    {scholar.profile_image ? (
                      <img
                        src={scholar.profile_image}
                        alt={sTrans.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-[#064E3B]/60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold block">
                      {sTrans.title}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 truncate mt-0.5">
                      {sTrans.name}
                    </h3>
                    {sTrans.location && (
                      <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                        {sTrans.location}
                      </p>
                    )}
                  </div>
                </div>

                {sTrans.bio && (
                  <p className="text-xs text-stone-600 line-clamp-2 mt-3 leading-relaxed">
                    {sTrans.bio}
                  </p>
                )}

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-end">
                  <button
                    onClick={() => navigate('scholar', scholar.slug)}
                    className="text-xs font-semibold text-[#064E3B] hover:text-[#064E3B]/80 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.viewProfile}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.D: LATEST ISLAMIC VIDEOS & SPEECHES */}
      {/* ------------------------------------------------------------- */}
      {showSpeeches && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
                تازہ ترین اسلامی ویڈیوز اور تقاریر • {t.speechesSubtitle}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                Islamic Videos & Speeches (اسلامی ویڈیوز اور بیانات)
              </h2>
            </div>
            <button
              onClick={() => navigate('speeches')}
              className="text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t.viewAllSpeeches}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {speeches.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
              <Volume2 className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-medium text-stone-700">No videos or speeches uploaded yet</p>
              <p className="text-xs text-stone-400">
                Authorized administrators can upload Islahi and Ilmi videos and speeches through the Admin Portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {speeches.slice(0, 12).map((speech) => {
                const thumbUrl = resolveMediaThumbnail(speech.thumbnail, speech.media_url);
                const isVideo = isVideoMedia(speech.media_url);

                return (
                  <div
                    key={speech.id}
                    onClick={() => onPlaySpeech(speech)}
                    className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-lg hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="relative aspect-video bg-stone-900 flex items-center justify-center overflow-hidden">
                      <img
                        src={thumbUrl}
                        alt={speech.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <button
                        onClick={() => onPlaySpeech(speech)}
                        className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#D4AF37] hover:bg-[#e0bc46] text-[#064E3B] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer"
                        title={isVideo ? 'Watch Islamic Video' : 'Listen to Speech'}
                      >
                        <Play className="w-5 h-5 ml-0.5 fill-[#064E3B]" />
                      </button>
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-white rounded flex items-center gap-1">
                        {isVideo ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>Video / ویڈیو</span>
                          </>
                        ) : (
                          <span>{translateCategory(speech.speech_type)}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark('speech', speech.id); }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer z-10 ${
                          isBookmarked('speech', speech.id)
                            ? 'bg-[#D4AF37] text-[#064E3B]'
                            : 'bg-black/60 text-white hover:text-[#D4AF37]'
                        }`}
                        title={isBookmarked('speech', speech.id) ? 'Saved to your profile' : 'Save speech'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked('speech', speech.id) ? 'fill-[#064E3B]' : ''}`} />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-[#064E3B] transition-colors">
                          {speech.title}
                        </h3>
                        <p className="text-xs text-emerald-800 font-medium mt-1">
                          {speech.scholar_name}
                        </p>
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
              );
            })}
          </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.E: ISLAMIC REELS (Vertical 9:16 layout, Dark background) */}
      {/* ------------------------------------------------------------- */}
      {showReels && (
        <section className="bg-[#101510] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">
                  {t.reelsSubtitle}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {t.islamicReels}
                </h2>
              </div>
              <button
                onClick={() => navigate('reels')}
                className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t.viewAllReels}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {reels.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-white/10 rounded-xl bg-white/5">
                <Film className="w-8 h-8 text-white/30 mx-auto" />
                <p className="text-sm text-white/70">No reels added yet</p>
                <p className="text-xs text-white/40">
                  Short spiritual reminders and clips can be published via the Admin Reels Manager.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {reels.slice(0, 4).map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => onPlayReel(reel)}
                    className="relative aspect-9/16 bg-stone-900 rounded-xl overflow-hidden cursor-pointer group border border-white/10 shadow-lg"
                  >
                    {reel.thumbnail ? (
                      <img
                        src={reel.thumbnail}
                        alt={reel.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#064E3B]/70 flex items-center justify-center">
                        <Film className="w-10 h-10 text-white/40" />
                      </div>
                    )}

                    {/* Gradient scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-between p-3.5">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBookmark('reel', reel.id); }}
                          className={`p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                            isBookmarked('reel', reel.id)
                              ? 'bg-[#D4AF37] text-[#064E3B]'
                              : 'bg-black/60 text-white hover:text-[#D4AF37]'
                          }`}
                          title={isBookmarked('reel', reel.id) ? 'Saved' : 'Save reel'}
                        >
                          <Bookmark className={`w-3 h-3 ${isBookmarked('reel', reel.id) ? 'fill-[#064E3B]' : ''}`} />
                        </button>
                        <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white/90">
                          {reel.duration || 'Short'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-[#D4AF37] truncate">
                          {reel.scholar_name}
                        </p>
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                          {reel.title}
                        </h4>
                      </div>
                    </div>

                    <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#D4AF37]/90 text-[#064E3B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Play className="w-4 h-4 ml-0.5 fill-[#064E3B]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.F: FEATURED BOOKS */}
      {/* ------------------------------------------------------------- */}
      {showBooks && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
                {t.librarySubtitle}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                {t.digitalLibrary}
              </h2>
            </div>
            <button
              onClick={() => navigate('books')}
              className="text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t.exploreLibrary}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {books.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-medium text-stone-700">Digital Library shelves are preparing</p>
              <p className="text-xs text-stone-400">
                Authorized books across Quran, Hadees, Fiqh, and Tasawwuf can be uploaded by administrators.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {books.slice(0, 12).map((book) => (
                <div
                  key={book.id}
                  onClick={() => onViewBook(book)}
                  className="bg-white rounded-xl border border-stone-200/90 p-3 hover:border-[#D4AF37] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="aspect-3/4 bg-stone-100 rounded-lg overflow-hidden relative mb-2.5 shadow-xs flex items-center justify-center border border-stone-100">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-stone-300" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark('book', book.id); }}
                      className={`absolute top-1.5 right-1.5 p-1 rounded-full backdrop-blur-xs transition-colors cursor-pointer z-10 ${
                        isBookmarked('book', book.id)
                          ? 'bg-[#D4AF37] text-[#064E3B]'
                          : 'bg-black/50 text-white hover:text-[#D4AF37]'
                      }`}
                      title={isBookmarked('book', book.id) ? 'Saved to library' : 'Save book'}
                    >
                      <Bookmark className={`w-3 h-3 ${isBookmarked('book', book.id) ? 'fill-[#064E3B]' : ''}`} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-800 font-bold block truncate">
                      {translateCategory(book.category_name || '')}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 line-clamp-1 group-hover:text-[#064E3B] transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[10px] text-stone-500 truncate">
                      {book.author_name}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400">{book.language || 'Urdu'}</span>
                    <span className="font-bold text-[#064E3B] group-hover:underline">
                      Read Kitab →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.G: LATEST ISLAMIC ARTICLES */}
      {/* ------------------------------------------------------------- */}
      {showArticles && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
                {t.articlesSubtitle}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                {t.latestArticles}
              </h2>
            </div>
            <button
              onClick={() => navigate('articles')}
              className="text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t.allArticles}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
              <FileText className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-medium text-stone-700">No articles published yet</p>
              <p className="text-xs text-stone-400">
                Scholarly writings, Shakhsiyat essays, and research articles can be published via the Admin Portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.slice(0, 3).map((article) => (
                <div
                  key={article.id}
                  onClick={() => onReadArticle(article.slug)}
                  className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  {article.featured_image && (
                    <div className="aspect-16/9 bg-stone-100 overflow-hidden">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold block mb-1">
                        {translateCategory(article.category_name || '')}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-[#064E3B] transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-xs text-stone-600 line-clamp-3 mt-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                      <span>{article.author_name || 'Mishkaat Idara'}</span>
                      <span>{article.publication_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.H: AQWAAL & NASIHAT */}
      {/* ------------------------------------------------------------- */}
      {showAqwaal && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
                {t.aqwaalSubtitle}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                {t.aqwaalTitle}
              </h2>
            </div>
            <button
              onClick={() => navigate('aqwaal')}
              className="text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t.viewAllMaxims}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {aqwaal.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
              <Quote className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-medium text-stone-700">No quotes or reminders entered yet</p>
              <p className="text-xs text-stone-400">
                Spiritual maxims and verified advice can be managed directly in the Admin Portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aqwaal.slice(0, 4).map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-stone-200/80 p-6 flex flex-col justify-between relative overflow-hidden"
                >
                  <Quote className="w-8 h-8 text-[#D4AF37]/30 mb-2" />
                  <p className="text-sm sm:text-base font-serif italic text-stone-800 leading-relaxed">
                    "{q.text}"
                  </p>

                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#064E3B]">
                        {q.scholar_name || q.attributed_to || 'Spiritual Nasihat'}
                      </span>
                      {q.reference_source && (
                        <span className="text-[11px] text-stone-400 block">
                          Ref: {q.reference_source}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                      {q.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3.I: SHAYARIYAN & SHARAH */}
      {/* ------------------------------------------------------------- */}
      {showShayariyan && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#064E3B] font-bold block mb-1">
                {t.shayariyanSubtitle}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                {t.shayariyanTitle}
              </h2>
            </div>
            <button
              onClick={() => navigate('shayariyan')}
              className="text-xs font-semibold text-[#064E3B] hover:text-[#D4AF37] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t.viewAllPoetry}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {shayariyan.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
              <Feather className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-medium text-stone-700">No poetry records entered yet</p>
              <p className="text-xs text-stone-400">
                Devotional verses and their in-depth Sharah can be curated via the Admin Portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shayariyan.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-stone-200/80 p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                        {item.category || 'Naat / Ghazal'}
                      </span>
                      <span>{item.poet_name}</span>
                    </div>
                    <h3 className="text-base font-bold text-stone-900 mb-4">
                      {item.title}
                    </h3>
                    <div className="font-urdu text-base sm:text-lg text-right text-stone-800 leading-loose py-2 border-y border-stone-100 bg-[#F4F8F4]/50 rounded-lg px-4 my-2">
                      {item.poetry_text}
                    </div>
                  </div>

                  {item.sharah && (
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <span className="text-[10px] uppercase font-bold text-[#064E3B] tracking-wider block mb-1">
                        Sharah (Explanation):
                      </span>
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {item.sharah}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
};
