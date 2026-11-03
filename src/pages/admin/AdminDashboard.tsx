import React from 'react';
import { Volume2, Film, BookOpen, FileText, Quote, Feather, Users, Plus, Settings, Key, ExternalLink } from 'lucide-react';
import { WebsiteStats, AdminUser } from '../../types';

interface AdminDashboardProps {
  stats: WebsiteStats | null;
  admin: AdminUser;
  setActiveTab: (tab: string) => void;
  onNavigatePublic: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  admin,
  setActiveTab,
  onNavigatePublic
}) => {
  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-[#064E3B] text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">
            System Administration
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            Welcome back, {admin.full_name}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Manage the sacred repository of Ahl-e-Sunnat knowledge, scholars, media, and digital library.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigatePublic}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition-colors cursor-pointer"
          >
            <span>View Public Platform</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Content Statistics (from DB) */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-stone-500 font-bold">
          Live Database Metrics (Published / Total)
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            {
              label: 'Videos & Speeches',
              published: stats?.published.speeches ?? 0,
              total: stats?.total.speeches ?? 0,
              icon: Volume2,
              tab: 'speeches'
            },
            {
              label: 'Reels',
              published: stats?.published.reels ?? 0,
              total: stats?.total.reels ?? 0,
              icon: Film,
              tab: 'reels'
            },
            {
              label: 'Books',
              published: stats?.published.books ?? 0,
              total: stats?.total.books ?? 0,
              icon: BookOpen,
              tab: 'books'
            },
            {
              label: 'Articles',
              published: stats?.published.articles ?? 0,
              total: stats?.total.articles ?? 0,
              icon: FileText,
              tab: 'articles'
            },
            {
              label: 'Aqwaal',
              published: stats?.published.aqwaal ?? 0,
              total: stats?.total.aqwaal ?? 0,
              icon: Quote,
              tab: 'aqwaal'
            },
            {
              label: 'Shayariyan',
              published: stats?.published.shayariyan ?? 0,
              total: stats?.total.shayariyan ?? 0,
              icon: Feather,
              tab: 'shayariyan'
            },
            {
              label: 'Scholars',
              published: stats?.published.scholars ?? 0,
              total: stats?.total.scholars ?? 0,
              icon: Users,
              tab: 'scholars'
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(item.tab)}
                className="bg-white p-4 rounded-xl border border-stone-200/80 hover:border-[#D4AF37] hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 text-[#064E3B] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-stone-400 font-mono">
                    Total: {item.total}
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                  {item.published}
                </div>
                <div className="text-xs text-stone-600 font-medium truncate mt-1">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Action Station */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-stone-500 font-bold">
          Direct Content Actions
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('speeches')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#064E3B] hover:bg-[#F4F8F4] transition-all text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:bg-[#064E3B] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-[#064E3B]">
                Upload Speech
              </span>
              <span className="text-[11px] text-stone-500">Islahi & Ilmi Taqreer</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('reels')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#064E3B] hover:bg-[#F4F8F4] transition-all text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:bg-[#064E3B] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-[#064E3B]">
                Publish Reel
              </span>
              <span className="text-[11px] text-stone-500">9:16 Short Video</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#064E3B] hover:bg-[#F4F8F4] transition-all text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:bg-[#064E3B] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-[#064E3B]">
                Add Book (Kitab)
              </span>
              <span className="text-[11px] text-stone-500">PDF & Reading Link</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#064E3B] hover:bg-[#F4F8F4] transition-all text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:bg-[#064E3B] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-[#064E3B]">
                Write Article
              </span>
              <span className="text-[11px] text-stone-500">Research & Shakhsiyat</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('aqwaal')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#064E3B] hover:bg-[#F4F8F4] transition-all text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:bg-[#064E3B] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-[#064E3B]">
                Add Aqwaal / Nasihat
              </span>
              <span className="text-[11px] text-stone-500">Spiritual Maxim</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('shayariyan')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#064E3B] hover:bg-[#F4F8F4] transition-all text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:bg-[#064E3B] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-[#064E3B]">
                Add Shayari & Sharah
              </span>
              <span className="text-[11px] text-stone-500">Naat & Commentary</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#064E3B] hover:bg-[#F4F8F4] transition-all text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37] group-hover:text-[#064E3B] transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-[#064E3B]">
                Website Settings
              </span>
              <span className="text-[11px] text-stone-500">Hero, Sections & Contact</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200/80 hover:border-[#064E3B] hover:bg-[#F4F8F4] transition-all text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-800 flex items-center justify-center shrink-0 group-hover:bg-rose-800 group-hover:text-white transition-colors">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block group-hover:text-[#064E3B]">
                Security & Password
              </span>
              <span className="text-[11px] text-stone-500">Update Credentials</span>
            </div>
          </button>
        </div>
      </div>

      {/* Guidelines & Operations Box */}
      <div className="p-5 bg-white rounded-xl border border-stone-200/80 space-y-2 text-xs text-stone-600">
        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
          Scholarly Integrity & Management Guidelines
        </h4>
        <p className="leading-relaxed">
          • All uploaded speeches and books are served strictly based on verified Ahle Sunnat scholarship.
          <br />
          • Each speech and reel is tied to a verified Scholar record via its unique database key.
          <br />
          • Books and media files can be uploaded directly to local secure storage or linked to authorized external streaming/reading URLs.
        </p>
      </div>

    </div>
  );
};
