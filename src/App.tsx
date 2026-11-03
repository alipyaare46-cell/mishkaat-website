import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { UserAuthProvider } from './context/UserAuthContext';
import { api } from './services/api';
import {
  Scholar,
  Speech,
  Reel,
  Book,
  BookCategory,
  Article,
  ArticleCategory,
  Aqwaal,
  AqwaalCategory,
  Shayariyan,
  WebsiteSettings,
  WebsiteStats
} from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import { ReelPlayerModal } from './components/ReelPlayerModal';
import { BookReaderModal } from './components/BookReaderModal';
import { UserAuthModal } from './components/UserAuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PwaInstallButton } from './components/PwaInstallButton';
import { HomePage } from './pages/HomePage';
import { SpeechesPage } from './pages/SpeechesPage';
import { ReelsPage } from './pages/ReelsPage';
import { BooksPage } from './pages/BooksPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { AqwaalPage } from './pages/AqwaalPage';
import { ShayariyanPage } from './pages/ShayariyanPage';
import { ScholarProfilePage } from './pages/ScholarProfilePage';
import { ContactPage } from './pages/ContactPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';

function MainApp() {
  const { admin, isLoading: authLoading } = useAuth();
  
  // Navigation
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [selectedScholarSlug, setSelectedScholarSlug] = useState<string | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState<Speech | null>(null);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [activeBook, setActiveBook] = useState<Book | null>(null);

  // Data states
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [stats, setStats] = useState<WebsiteStats | null>(null);
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookCategories, setBookCategories] = useState<BookCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleCategories, setArticleCategories] = useState<ArticleCategory[]>([]);
  const [aqwaal, setAqwaal] = useState<Aqwaal[]>([]);
  const [aqwaalCategories, setAqwaalCategories] = useState<AqwaalCategory[]>([]);
  const [shayariyan, setShayariyan] = useState<Shayariyan[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    try {
      const [
        settingsData,
        statsData,
        scholarsData,
        speechesData,
        reelsData,
        booksData,
        bookCatsData,
        articlesData,
        articleCatsData,
        aqwaalData,
        aqwaalCatsData,
        shayariyanData
      ] = await Promise.all([
        api.getSettings().catch(() => null),
        api.getStats().catch(() => null),
        api.getScholars(admin ? true : false).catch(() => []),
        api.getSpeeches({ all: !!admin }).catch(() => []),
        api.getReels({ all: !!admin }).catch(() => []),
        api.getBooks({ all: !!admin }).catch(() => []),
        api.getBookCategories().catch(() => []),
        api.getArticles({ all: !!admin }).catch(() => []),
        api.getArticleCategories().catch(() => []),
        api.getAqwaal({ all: !!admin }).catch(() => []),
        api.getAqwaalCategories().catch(() => []),
        api.getShayariyan({ all: !!admin }).catch(() => [])
      ]);

      if (settingsData) setSettings(settingsData);
      if (statsData) setStats(statsData);
      setScholars(scholarsData);
      setSpeeches(speechesData);
      setReels(reelsData);
      setBooks(booksData);
      setBookCategories(bookCatsData);
      setArticles(articlesData);
      setArticleCategories(articleCatsData);
      setAqwaal(aqwaalData);
      setAqwaalCategories(aqwaalCatsData);
      setShayariyan(shayariyanData);
    } catch (err) {
      console.error('Failed to load platform data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    fetchAllData();
  }, [currentRoute, fetchAllData]);

  // Handle URL hash changes or internal navigation
  const navigate = (route: string, param?: string) => {
    if (route === 'scholar' && param) {
      setSelectedScholarSlug(param);
    } else if (route === 'article' && param) {
      setSelectedArticleSlug(param);
      setCurrentRoute('articles');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchAllData();
      return;
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchAllData();
  };

  const handleSearchResult = (type: string, idOrSlug: string) => {
    setIsSearchOpen(false);
    if (type === 'scholar') {
      navigate('scholar', idOrSlug);
    } else if (type === 'speech') {
      const sp = speeches.find((s) => s.id === idOrSlug);
      if (sp) setActiveSpeech(sp);
    } else if (type === 'reel') {
      const r = reels.find((rel) => rel.id === idOrSlug);
      if (r) setActiveReel(r);
    } else if (type === 'book') {
      const b = books.find((bk) => bk.id === idOrSlug);
      if (b) setActiveBook(b);
    } else if (type === 'article') {
      navigate('article', idOrSlug);
    } else if (type === 'aqwaal') {
      navigate('aqwaal');
    } else if (type === 'shayariyan') {
      navigate('shayariyan');
    }
  };

  // If viewing the Admin Portal
  if (currentRoute === 'admin') {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#F4F8F4] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#064E3B] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!admin) {
      return (
        <AdminLogin
          onBackToPublic={() => navigate('home')}
        />
      );
    }

    return (
      <AdminLayout
        stats={stats}
        scholars={scholars}
        speeches={speeches}
        reels={reels}
        books={books}
        bookCategories={bookCategories}
        articles={articles}
        articleCategories={articleCategories}
        aqwaal={aqwaal}
        aqwaalCategories={aqwaalCategories}
        shayariyan={shayariyan}
        settings={settings}
        onRefreshAll={fetchAllData}
        onNavigatePublic={() => navigate('home')}
        onPreviewSpeech={(s) => setActiveSpeech(s)}
        onPreviewReel={(r) => setActiveReel(r)}
        onViewBook={(b) => setActiveBook(b)}
        onPreviewArticle={(slug) => {
          setSelectedArticleSlug(slug);
          navigate('articles');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8F4] text-[#202820] flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#064E3B]">
      
      {/* Global Navigation Header */}
      <Header
        currentRoute={currentRoute}
        navigate={navigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <HomePage
            settings={settings}
            stats={stats}
            scholars={scholars}
            speeches={speeches}
            reels={reels}
            books={books}
            articles={articles}
            aqwaal={aqwaal}
            shayariyan={shayariyan}
            navigate={navigate}
            onPlaySpeech={(s) => setActiveSpeech(s)}
            onPlayReel={(r) => setActiveReel(r)}
            onViewBook={(b) => setActiveBook(b)}
            onReadArticle={(slug) => {
              setSelectedArticleSlug(slug);
              navigate('articles');
            }}
          />
        )}

        {currentRoute === 'speeches' && (
          <SpeechesPage
            speeches={speeches}
            scholars={scholars}
            onPlaySpeech={(s) => setActiveSpeech(s)}
            navigate={navigate}
          />
        )}

        {currentRoute === 'reels' && (
          <ReelsPage
            reels={reels}
            scholars={scholars}
            onPlayReel={(r) => setActiveReel(r)}
            navigate={navigate}
          />
        )}

        {currentRoute === 'books' && (
          <BooksPage
            books={books}
            categories={bookCategories}
            onViewBook={(b) => setActiveBook(b)}
          />
        )}

        {currentRoute === 'articles' && (
          <ArticlesPage
            articles={articles}
            categories={articleCategories}
            activeArticleSlug={selectedArticleSlug}
            onSelectArticle={(slug) => setSelectedArticleSlug(slug)}
            onBackToList={() => setSelectedArticleSlug(null)}
          />
        )}

        {currentRoute === 'aqwaal' && (
          <AqwaalPage
            aqwaal={aqwaal}
            categories={aqwaalCategories}
          />
        )}

        {currentRoute === 'shayariyan' && (
          <ShayariyanPage
            shayariyan={shayariyan}
          />
        )}

        {currentRoute === 'contact' && (
          <ContactPage
            settings={settings}
            navigate={navigate}
          />
        )}

        {currentRoute === 'scholar' && selectedScholarSlug && (
          <ScholarProfilePage
            slug={selectedScholarSlug}
            onBack={() => navigate('speeches')}
            onPlaySpeech={(s) => setActiveSpeech(s)}
            onPlayReel={(r) => setActiveReel(r)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        navigate={navigate}
      />

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResult}
      />

      <MediaPlayerModal
        speech={activeSpeech}
        onClose={() => setActiveSpeech(null)}
        onNavigateScholar={(slug) => navigate('scholar', slug)}
      />

      <ReelPlayerModal
        reel={activeReel}
        reels={reels}
        onSelectReel={(r) => setActiveReel(r)}
        onClose={() => setActiveReel(null)}
        onNavigateScholar={(slug) => navigate('scholar', slug)}
      />


      <BookReaderModal
        book={activeBook}
        onClose={() => setActiveBook(null)}
      />

      {/* Member User Sign In / Registration Modal */}
      <UserAuthModal />

      {/* Member User Saved Items & Profile Modal */}
      <UserProfileModal
        speeches={speeches}
        reels={reels}
        books={books}
        articles={articles}
        aqwaal={aqwaal}
        shayariyan={shayariyan}
        onPlaySpeech={(s) => setActiveSpeech(s)}
        onPlayReel={(r) => setActiveReel(r)}
        onViewBook={(b) => setActiveBook(b)}
        onViewArticle={(slug) => {
          setSelectedArticleSlug(slug);
          navigate('articles');
        }}
      />

      {/* Floating PWA Install & Auto-Update Banner */}
      <PwaInstallButton variant="banner" />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <UserAuthProvider>
          <MainApp />
        </UserAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
