import React, { useState } from 'react';
import { X, User, Mail, LogOut, Bookmark, BookOpen, Volume2, Film, FileText, Trash2, Key, CheckCircle2, Play } from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { Speech, Reel, Book, Article, Aqwaal, Shayariyan } from '../types';
import { api } from '../services/api';

interface UserProfileModalProps {
  speeches: Speech[];
  reels: Reel[];
  books: Book[];
  articles: Article[];
  aqwaal: Aqwaal[];
  shayariyan: Shayariyan[];
  onPlaySpeech: (speech: Speech) => void;
  onPlayReel: (reel: Reel) => void;
  onViewBook: (book: Book) => void;
  onViewArticle: (slug: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  speeches,
  reels,
  books,
  articles,
  aqwaal,
  shayariyan,
  onPlaySpeech,
  onPlayReel,
  onViewBook,
  onViewArticle
}) => {
  const { user, isProfileModalOpen, setIsProfileModalOpen, logoutUser, allBookmarks, toggleBookmark, refreshUser } = useUserAuth();

  const [activeTab, setActiveTab] = useState<'speeches' | 'reels' | 'books' | 'articles' | 'settings'>('speeches');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isProfileModalOpen || !user) return null;

  // Filter bookmarked items
  const savedSpeechIds = new Set(allBookmarks.filter(b => b.item_type === 'speech').map(b => b.item_id));
  const savedSpeeches = speeches.filter(s => savedSpeechIds.has(s.id));

  const savedReelIds = new Set(allBookmarks.filter(b => b.item_type === 'reel').map(b => b.item_id));
  const savedReels = reels.filter(r => savedReelIds.has(r.id));

  const savedBookIds = new Set(allBookmarks.filter(b => b.item_type === 'book').map(b => b.item_id));
  const savedBooks = books.filter(b => savedBookIds.has(b.id));

  const savedArticleIds = new Set(allBookmarks.filter(b => b.item_type === 'article').map(b => b.item_id));
  const savedArticles = articles.filter(a => savedArticleIds.has(a.id));

  const savedAqwaalIds = new Set(allBookmarks.filter(b => b.item_type === 'aqwaal').map(b => b.item_id));
  const savedAqwaal = aqwaal.filter(q => savedAqwaalIds.has(q.id));

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setIsSaving(true);

    try {
      await api.updateUserProfile({
        full_name: fullName,
        bio,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      refreshUser();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsProfileModalOpen(false);
    setMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#064E3B] text-white p-6 pb-4 border-b border-[#D4AF37]/30 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#D4AF37] text-[#064E3B] flex items-center justify-center text-xl font-bold font-display shadow-md">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-white">
                    {user.full_name}
                  </h2>
                  <span className="text-[10px] font-semibold bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                    Mishkaat Member
                  </span>
                </div>
                <p className="text-xs text-emerald-200 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={logoutUser}
                className="p-2 text-rose-200 hover:text-white hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-2 border-t border-emerald-800/60 no-scrollbar">
            <button
              onClick={() => setActiveTab('speeches')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'speeches' ? 'bg-[#D4AF37] text-[#064E3B]' : 'text-emerald-100 hover:bg-emerald-800/40'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Speeches ({savedSpeeches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reels')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'reels' ? 'bg-[#D4AF37] text-[#064E3B]' : 'text-emerald-100 hover:bg-emerald-800/40'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Reels ({savedReels.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'books' ? 'bg-[#D4AF37] text-[#064E3B]' : 'text-emerald-100 hover:bg-emerald-800/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Books ({savedBooks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'articles' ? 'bg-[#D4AF37] text-[#064E3B]' : 'text-emerald-100 hover:bg-emerald-800/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Articles & Quotes ({savedArticles.length + savedAqwaal.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-[#D4AF37] text-[#064E3B]' : 'text-emerald-100 hover:bg-emerald-800/40'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F4F8F4]">
          {/* Tab 1: Speeches */}
          {activeTab === 'speeches' && (
            <div className="space-y-3">
              {savedSpeeches.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
                  <Volume2 className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-sm font-medium text-stone-700">No saved speeches yet</p>
                  <p className="text-xs text-stone-400">
                    Click the bookmark icon on any Islahi or Ilmi Taqreer to save it here for easy listening.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedSpeeches.map((sp) => (
                    <div
                      key={sp.id}
                      className="bg-white rounded-xl border border-stone-200 p-3 hover:border-[#D4AF37]/60 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          onClick={() => { handleClose(); onPlaySpeech(sp); }}
                          className="w-12 h-12 rounded-lg bg-stone-900 shrink-0 relative overflow-hidden cursor-pointer flex items-center justify-center group-hover:scale-105 transition-transform"
                        >
                          {sp.thumbnail ? (
                            <img src={sp.thumbnail} alt={sp.title} className="w-full h-full object-cover" />
                          ) : (
                            <Volume2 className="w-5 h-5 text-white/60" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 
                            onClick={() => { handleClose(); onPlaySpeech(sp); }}
                            className="text-xs font-bold text-stone-900 truncate hover:text-[#064E3B] cursor-pointer"
                          >
                            {sp.title}
                          </h4>
                          <p className="text-[11px] text-emerald-800 truncate">{sp.scholar_name}</p>
                          <span className="text-[10px] text-stone-400">{sp.speech_type}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleBookmark('speech', sp.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Reels */}
          {activeTab === 'reels' && (
            <div className="space-y-3">
              {savedReels.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
                  <Film className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-sm font-medium text-stone-700">No saved reels yet</p>
                  <p className="text-xs text-stone-400">
                    Bookmark your favorite vertical reels to watch anytime.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {savedReels.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col justify-between group relative"
                    >
                      <div 
                        onClick={() => { handleClose(); onPlayReel(r); }}
                        className="relative aspect-9/14 bg-stone-900 cursor-pointer overflow-hidden"
                      >
                        {r.thumbnail ? (
                          <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#101510]">
                            <Film className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-6 h-6 fill-[#D4AF37] text-[#D4AF37]" />
                        </div>
                      </div>

                      <div className="p-2 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <h5 className="text-[11px] font-bold text-stone-900 truncate">{r.title}</h5>
                          <p className="text-[10px] text-emerald-800 truncate">{r.scholar_name}</p>
                        </div>
                        <button
                          onClick={() => toggleBookmark('reel', r.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Books */}
          {activeTab === 'books' && (
            <div className="space-y-3">
              {savedBooks.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-sm font-medium text-stone-700">No saved books yet</p>
                  <p className="text-xs text-stone-400">
                    Add books from Tafseer, Hadees, Fiqh, and Tasawwuf to your personal Islamic reading shelf.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedBooks.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-xl border border-stone-200 p-3 hover:border-[#D4AF37]/60 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          onClick={() => { handleClose(); onViewBook(b); }}
                          className="w-12 h-16 rounded-md bg-stone-100 shrink-0 overflow-hidden border border-stone-200 cursor-pointer shadow-xs"
                        >
                          {b.cover_image ? (
                            <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-stone-400 m-auto mt-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 
                            onClick={() => { handleClose(); onViewBook(b); }}
                            className="text-xs font-bold text-stone-900 truncate hover:text-[#064E3B] cursor-pointer"
                          >
                            {b.title}
                          </h4>
                          <p className="text-[11px] text-stone-600 truncate">{b.author_name}</p>
                          <span className="text-[10px] text-emerald-800 font-semibold">{b.category_name}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleBookmark('book', b.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Articles & Quotes */}
          {activeTab === 'articles' && (
            <div className="space-y-4">
              {savedArticles.length === 0 && savedAqwaal.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-sm font-medium text-stone-700">No saved articles or quotes</p>
                  <p className="text-xs text-stone-400">
                    Bookmark scholarly essays and spiritual reminders (Aqwaal & Nasihat) to reflect on them anytime.
                  </p>
                </div>
              ) : (
                <>
                  {savedArticles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#064E3B]">
                        Saved Articles ({savedArticles.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedArticles.map((a) => (
                          <div
                            key={a.id}
                            className="bg-white rounded-xl border border-stone-200 p-3 flex items-center justify-between gap-3"
                          >
                            <div 
                              onClick={() => { handleClose(); onViewArticle(a.slug); }}
                              className="min-w-0 cursor-pointer"
                            >
                              <h5 className="text-xs font-bold text-stone-900 truncate hover:text-[#064E3B]">{a.title}</h5>
                              <p className="text-[11px] text-stone-500 truncate">{a.author_name}</p>
                            </div>
                            <button
                              onClick={() => toggleBookmark('article', a.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {savedAqwaal.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#064E3B]">
                        Saved Spiritual Quotes ({savedAqwaal.length})
                      </h4>
                      <div className="space-y-2">
                        {savedAqwaal.map((q) => (
                          <div
                            key={q.id}
                            className="bg-white rounded-xl border border-stone-200 p-3 flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0 text-xs">
                              <p className="text-stone-800 leading-relaxed font-serif">"{q.text}"</p>
                              <p className="text-[11px] text-[#064E3B] font-bold mt-1">— {q.scholar_name || q.attributed_to}</p>
                            </div>
                            <button
                              onClick={() => toggleBookmark('aqwaal', q.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab 5: Settings */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl border border-stone-200 p-6 max-w-lg mx-auto">
              {msg && (
                <div className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {msg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Short Bio / Spiritual Note
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Seeker of sacred knowledge..."
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <h5 className="text-xs font-bold text-stone-800 mb-2">Change Password (Optional)</h5>
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current Password"
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B]"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password (min 6 chars)"
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#064E3B]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 bg-[#064E3B] hover:bg-[#085a44] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
