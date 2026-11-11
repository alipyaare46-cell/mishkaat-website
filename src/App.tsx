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

// Helpers for clean URL path-based routing & browser history
function getRouteFromPath(): { route: string; param: string | null } {
  if (typeof window === 'undefined') return { route: 'home', param: null };

  let rawPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (!rawPath && window.location.hash) {
    rawPath = window.location.hash.replace(/^#\/?/, '').toLowerCase().replace(/^\/+|\/+$/g, '');
  }

  if (!rawPath) return { route: 'home', param: null };

  const parts = rawPath.split('/');
  const segment1 = parts[0];
  const param = parts[1] ? decodeURIComponent(parts[1]) : null;

  if (segment1 === 'scholar') {
    return { route: 'scholar', param };
  }
  if (segment1 === 'article' || segment1 === 'articles') {
    return { route: 'articles', param };
  }
  if (['home', 'speeches', 'reels', 'books', 'articles', 'aqwaal', 'shayariyan', 'contact', 'admin'].includes(segment1)) {
    return { route: segment1, param };
  }

  return { route: 'home', param: null };
}

function getPathFromRoute(route: string, param?: string | null): string {
  if (route === 'home') return '/';
  if (route === 'scholar' && param) return `/scholar/${encodeURIComponent(param)}`;
  if (route === 'articles') {
    return param ? `/articles/${encodeURIComponent(param)}` : '/articles';
  }
  if (route === 'article' && param) {
    return `/articles/${encodeURIComponent(param)}`;
  }
  return `/${route}`;
}

function MainApp() {
  const { admin, isLoading: authLoading } = useAuth();
  
  // Navigation states initialized from the current browser URL
  const [currentRoute, setCurrentRoute] = useState<string>(
    () => getRouteFromPath().route
  );

  const [selectedScholarSlug, setSelectedScholarSlug] = useState<string | null>(
    () => (getRouteFromPath().route === 'scholar' ? getRouteFromPath().param : null)
  );

  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(
    () => (getRouteFromPath().route === 'articles' ? getRouteFromPath().param : null)
  );

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
useEffect(() => {
  const pageTitles: Record<string, string> = {
    home: 'MISHKAAT | Islamic Knowledge & Media Platform',
    speeches: 'Islamic Speeches | MISHKAAT',
    reels: 'Islamic Reels | MISHKAAT',
    books: 'Islamic Books | MISHKAAT',
    articles: 'Islamic Articles | MISHKAAT',
    aqwaal: 'Islamic Aqwaal | MISHKAAT',
    shayariyan: 'Islamic Shayariyan | MISHKAAT',
    contact: 'Contact Us | MISHKAAT',
    scholar: 'Islamic Scholars | MISHKAAT',
    admin: 'Admin Portal | MISHKAAT',
  };

  document.title = pageTitles[currentRoute] || 'MISHKAAT | Islamic Platform';
  const descriptions: Record<string, string> = {
  home: 'Explore authentic Islamic knowledge, speeches, books and articles at MISHKAAT.',
  speeches: 'Listen to Islamic speeches and beneficial lectures from Ahl-e-Sunnat scholars.',
  reels: 'Watch Islamic reels and short videos with meaningful Islamic reminders.',
  books: 'Explore Islamic books on Quran, Hadees, Fiqh, Tasawwuf and more.',
  articles: 'Read Islamic articles, research and informative religious writings.',
  aqwaal: 'Discover inspiring Islamic quotes and wisdom from respected scholars.',
  shayariyan: 'Read devotional Islamic poetry and beautiful Urdu shayari.',
  contact: 'Contact the MISHKAAT team for questions, suggestions and feedback.',
  scholar: 'Learn about respected Islamic scholars and their contributions.',
  admin: 'MISHKAAT administration portal.',
};

let description = descriptions[currentRoute] || descriptions.home;
let metaDescription = document.querySelector('meta[name="description"]');

if (!metaDescription) {
  metaDescription = document.createElement('meta');
  metaDescription.setAttribute('name', 'description');
  document.head.appendChild(metaDescription);
}

metaDescription.setAttribute('content', description);
}, [currentRoute]);
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

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const routeInfo = getRouteFromPath();
      setCurrentRoute(routeInfo.route);
      setSelectedScholarSlug(routeInfo.route === 'scholar' ? routeInfo.param : null);
      setSelectedArticleSlug(routeInfo.route === 'articles' ? routeInfo.param : null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle URL navigation with history pushState
  const navigate = (route: string, param?: string) => {
    const nextRoute = route === 'article' ? 'articles' : route;

    if (nextRoute === 'scholar') {
      setSelectedScholarSlug(param || null);
    } else {
      setSelectedScholarSlug(null);
    }

    if (nextRoute === 'articles') {
      setSelectedArticleSlug(param || null);
    } else {
      setSelectedArticleSlug(null);
    }

    const nextPath = getPathFromRoute(nextRoute, param);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    setCurrentRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      navigate('articles', idOrSlug);
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
        onPreviewArticle={(slug) => navigate('articles', slug)}
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
            onReadArticle={(slug) => navigate('articles', slug)}
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
            onSelectArticle={(slug) => navigate('articles', slug)}
            onBackToList={() => navigate('articles')}
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

      {/* Global Footer */}
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
      />

      <ReelPlayerModal
        reel={activeReel}
        reels={reels}
        onClose={() => setActiveReel(null)}
        onSelectReel={(r) => setActiveReel(r)}
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
        onViewArticle={(slug) => navigate('articles', slug)}
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
