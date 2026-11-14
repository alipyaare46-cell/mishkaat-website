import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Volume2,
  Film,
  BookOpen,
  FileText,
  Quote,
  Feather,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WebsiteStats, Scholar, Speech, Reel, Book, BookCategory, Article, ArticleCategory, Aqwaal, AqwaalCategory, Shayariyan, WebsiteSettings } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminScholars } from './AdminScholars';
import { AdminSpeeches } from './AdminSpeeches';
import { AdminReels } from './AdminReels';
import { AdminBooks } from './AdminBooks';
import { AdminArticles } from './AdminArticles';
import { AdminAqwaal } from './AdminAqwaal';
import { AdminShayariyan } from './AdminShayariyan';
import { AdminContactMessages } from './AdminContactMessages';
import { AdminSettings } from './AdminSettings';
import { AdminSecurity } from './AdminSecurity';


interface AdminLayoutProps {
  stats: WebsiteStats | null;
  scholars: Scholar[];
  speeches: Speech[];
  reels: Reel[];
  books: Book[];
  bookCategories: BookCategory[];
  articles: Article[];
  articleCategories: ArticleCategory[];
  aqwaal: Aqwaal[];
  aqwaalCategories: AqwaalCategory[];
  shayariyan: Shayariyan[];
  settings: WebsiteSettings | null;
  onRefreshAll: () => void;
  onNavigatePublic: () => void;
  onPreviewSpeech: (speech: Speech) => void;
  onPreviewReel: (reel: Reel) => void;
  onViewBook: (book: Book) => void;
  onPreviewArticle: (slug: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  stats,
  scholars,
  speeches,
  reels,
  books,
  bookCategories,
  articles,
  articleCategories,
  aqwaal,
  aqwaalCategories,
  shayariyan,
  settings,
  onRefreshAll,
  onNavigatePublic,
  onPreviewSpeech,
  onPreviewReel,
  onViewBook,
  onPreviewArticle
}) => {
  const { admin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scholars', label: 'Scholars Directory', icon: Users, count: scholars.length },
    { id: 'speeches', label: 'Videos & Speeches (ویڈیوز / تقاریر)', icon: Volume2, count: speeches.length },
    { id: 'reels', label: 'Islamic Reels', icon: Film, count: reels.length },
    { id: 'books', label: 'Digital Library (Books)', icon: BookOpen, count: books.length },
    { id: 'articles', label: 'Articles & Research', icon: FileText, count: articles.length },
    { id: 'aqwaal', label: 'Aqwaal & Nasihat', icon: Quote, count: aqwaal.length },
    { id: 'shayariyan', label: 'Shayariyan & Sharah', icon: Feather, count: shayariyan.length },
    { id: 'messages', label: 'Visitor Inquiries', icon: Mail },
    { id: 'settings', label: 'Website Settings', icon: Settings },
    { id: 'security', label: 'Security & Password', icon: ShieldCheck },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F8F4] flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-[#064E3B] text-white border-b border-[#064E3B]/90 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2.5">
              <img
                src="/icon-192.png"
                alt="Mishkaat Logo"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-md bg-white object-contain p-0.5 border border-[#D4AF37]/60"
              />
              <span className="font-display text-lg font-bold tracking-wider text-[#D4AF37]">
                MISHKAAT
              </span>
              <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider text-emerald-200/80 font-semibold px-2 py-0.5 rounded bg-white/10">
                Admin Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigatePublic}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-100 hover:text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800/50 transition-colors cursor-pointer"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            {admin && (
              <span className="hidden md:inline-block text-xs text-emerald-200 border-l border-emerald-800/60 pl-3">
                {admin.full_name}
              </span>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside
          className={`fixed lg:sticky top-16 z-20 w-64 h-[calc(100vh-4rem)] bg-white border-r border-stone-200 flex flex-col justify-between transition-transform duration-200 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-1 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 px-3 py-2">
              Content & Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#064E3B] text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-stone-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-stone-200 text-[11px] text-stone-500 space-y-1">
            <div className="text-[10px] text-stone-400">
              Mishkaat Platform · Protected Gateway
            </div>
            <div className="font-display text-[10px] font-bold tracking-wider text-[#064E3B] uppercase">
              POWERED BY SYED ALI QALANDAR PEERZADE
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && admin && (
            <AdminDashboard
              stats={stats}
              admin={admin}
              setActiveTab={setActiveTab}
              onNavigatePublic={onNavigatePublic}
            />
          )}

          {activeTab === 'scholars' && (
            <AdminScholars
              scholars={scholars}
              onRefresh={onRefreshAll}
            />
          )}

          {activeTab === 'speeches' && (
            <AdminSpeeches
              speeches={speeches}
              scholars={scholars}
              onRefresh={onRefreshAll}
              onPreviewSpeech={onPreviewSpeech}
            />
          )}

          {activeTab === 'reels' && (
            <AdminReels
              reels={reels}
              scholars={scholars}
              onRefresh={onRefreshAll}
              onPreviewReel={onPreviewReel}
            />
          )}

          {activeTab === 'books' && (
            <AdminBooks
              books={books}
              categories={bookCategories}
              onRefresh={onRefreshAll}
              onViewBook={onViewBook}
            />
          )}

          {activeTab === 'articles' && (
            <AdminArticles
              articles={articles}
              categories={articleCategories}
              onRefresh={onRefreshAll}
              onPreviewArticle={onPreviewArticle}
            />
          )}

          {activeTab === 'aqwaal' && (
            <AdminAqwaal
              aqwaal={aqwaal}
              categories={aqwaalCategories}
              scholars={scholars}
              onRefresh={onRefreshAll}
            />
          )}

          {activeTab === 'shayariyan' && (
            <AdminShayariyan
              shayariyan={shayariyan}
              onRefresh={onRefreshAll}
            />
          )}

          {activeTab === 'messages' && (
            <AdminContactMessages onRefreshAll={onRefreshAll} />
          )}

          {activeTab === 'settings' && (
            <AdminSettings
              settings={settings}
              onRefresh={onRefreshAll}
            />
          )}

          {activeTab === 'security' && (
            <AdminSecurity />
          )}
        </main>
      </div>
    </div>
  );
};
