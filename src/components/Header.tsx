import React, { useState } from 'react';
import { Search, Menu, X, Shield, BookOpen, Volume2, Film, FileText, Quote, Feather, Globe, User as UserIcon, Bookmark, Mail } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';
import { useUserAuth } from '../context/UserAuthContext';
import { PwaInstallButton } from './PwaInstallButton';

function getPathFromRoute(route: string): string {
  if (route === 'home') return '/';
  return `/${route}`;
}

interface HeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, navigate, onOpenSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, openAuthModal, setIsProfileModalOpen, allBookmarks } = useUserAuth();

  const navLinks = [
    { label: t.home, route: 'home', icon: BookOpen },
    { label: t.speeches, route: 'speeches', icon: Volume2 },
    { label: t.reels, route: 'reels', icon: Film },
    { label: t.books, route: 'books', icon: BookOpen },
    { label: t.articles, route: 'articles', icon: FileText },
    { label: t.aqwaal, route: 'aqwaal', icon: Quote },
    { label: t.shayariyan, route: 'shayariyan', icon: Feather },
    { label: t.contact, route: 'contact', icon: Mail },
  ];


  const handleNav = (route: string) => {
    navigate(route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setLangMenuOpen(false);
  };

  const languageLabels: Record<Language, { label: string; native: string }> = {
    en: { label: 'English', native: 'English' },
    ur: { label: 'Urdu', native: 'اردو' },
    ar: { label: 'Arabic', native: 'العربية' }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#064E3B] text-white shadow-md border-b border-[#064E3B]/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 sm:gap-6 h-18">
          
          {/* Zone 1: Brand Wordmark & Emblem */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg py-1 whitespace-nowrap shrink-0"
          >
            <img
              src="/assets/aistudio/Mishkaat_Emerald_Gold_Emblem_2c4210f5.png"
              alt="Mishkaat Logo"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-lg bg-white object-contain p-0.5 border border-[#D4AF37]/70 shadow-sm transition-transform duration-200 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-display text-xl sm:text-2xl font-bold tracking-wider text-[#D4AF37] leading-none">
                MISHKAAT
              </span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-100/80 font-sans mt-0.5">
                {language === 'ur' ? 'مرکزِ علومِ اسلامی' : language === 'ar' ? 'منصة العلوم الإسلامية' : 'Islamic Knowledge'}
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (single line, subtle hover indicator) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium">
            {navLinks.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                
  <a
  key={item.route}
  href={getPathFromRoute(item.route)}
  onClick={(e) => {
    e.preventDefault();
    handleNav(item.route);
  }}
  className={`relative py-1.5 whitespace-nowrap transition-colors duration-150 cursor-pointer ${
    isActive
      ? 'text-[#D4AF37] font-semibold'
      : 'text-emerald-100 hover:text-white'
  }`}
>
  {item.label}
  {isActive && (
    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
  )}
</a>

                  
                
              );
            })}
          </nav>

          {/* Zone 3: Search, Language & Portal Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-100 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
                title="Change language / زبان تبدیل کریں / تغيير اللغة"
                aria-expanded={langMenuOpen}
              >
                <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="font-semibold">{languageLabels[language].native}</span>
              </button>

              {langMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 bg-[#053d2e] border border-emerald-700/80 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in duration-100"
                  onMouseLeave={() => setLangMenuOpen(false)}
                >
                  {(['en', 'ur', 'ar'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleSelectLanguage(lang)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-800/80 transition-colors cursor-pointer ${
                        language === lang ? 'text-[#D4AF37] font-bold bg-emerald-900/40' : 'text-emerald-100'
                      }`}
                    >
                      <span>{languageLabels[lang].native}</span>
                      <span className="text-[10px] text-emerald-400/80">({lang.toUpperCase()})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onOpenSearch}
              className="p-2 text-emerald-100 hover:text-[#D4AF37] hover:bg-emerald-800/50 rounded-lg transition-colors cursor-pointer"
              title={t.search}
              aria-label="Open search dialog"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Member Sign In / Profile Button */}
            {user ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/15 border border-[#D4AF37]/50 rounded-md transition-all cursor-pointer shadow-xs"
                title="My Saved Collection & Profile"
              >
                <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#064E3B] flex items-center justify-center text-[10px] font-bold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline max-w-[80px] truncate">{user.full_name.split(' ')[0]}</span>
                {allBookmarks.length > 0 && (
                  <span className="bg-[#D4AF37] text-[#064E3B] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {allBookmarks.length}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-md transition-all cursor-pointer"
                title="Sign In / Register"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline">
                  {language === 'ur' ? 'داخل ہوں' : language === 'ar' ? 'دخول' : 'Sign In'}
                </span>
              </button>
            )}

            {/* PWA Download / Install App Button */}
            <PwaInstallButton variant="header" />

            <button
              onClick={() => handleNav('admin')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#064E3B] bg-[#D4AF37] hover:bg-[#e0bc46] rounded-md transition-all duration-150 shadow-sm whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.portal}</span>
            </button>

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-emerald-100 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#053d2e] border-t border-emerald-800/60 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Mobile Language Switcher Row */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-800/50 text-xs">
            <span className="text-emerald-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Language / زبان:</span>
            </span>
            <div className="flex items-center gap-1">
              {(['en', 'ur', 'ar'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleSelectLanguage(lang)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    language === lang
                      ? 'bg-[#D4AF37] text-[#064E3B] font-bold'
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                >
                  {languageLabels[lang].native}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Member User Account Row */}
          <div className="pb-2 mb-2 border-b border-emerald-800/50">
            {user ? (
              <button
                onClick={() => { setMobileMenuOpen(false); setIsProfileModalOpen(true); }}
                className="w-full flex items-center justify-between px-3 py-2 bg-emerald-900/60 border border-[#D4AF37]/40 rounded-lg text-emerald-100 text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#064E3B] font-bold flex items-center justify-center text-xs">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-white">{user.full_name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#D4AF37]">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{allBookmarks.length} Saved</span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); openAuthModal('signin'); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-emerald-100 text-xs font-semibold cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-[#D4AF37]" />
                <span>Member Sign In / Create Account</span>
              </button>
            )}
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
             <a
  key={item.route}
  href={getPathFromRoute(item.route)}
  onClick={(e) => {
    e.preventDefault();
    handleNav(item.route);
  }}
  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
    isActive
      ? 'bg-emerald-800/90 text-[#D4AF37] font-semibold'
      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
  }`}
>
  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-emerald-300'}`} />
  <span>{item.label}</span>
</a>
            );
          })}
          
          <div className="pt-2 border-t border-emerald-800/50 mt-2 space-y-2">
            <PwaInstallButton variant="menu" />

            <button
              onClick={() => handleNav('admin')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#064E3B] bg-[#D4AF37] hover:bg-[#e0bc46] rounded-lg transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>{t.portal} (Admin)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
