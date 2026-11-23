import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Search,
  Loader2,
  Shield,
  User as UserIcon,
  Globe,
  ExternalLink
} from 'lucide-react';
import { ActivityPerson, ActivityTabType, ItemActivityResponse } from '../types';
import { api } from '../services/api';

// Short-lived shared cache per item so hovering multiple badges or reopening modal feels instant
const activityCache = new Map<string, { data: ItemActivityResponse; fetchedAt: number }>();
const CACHE_TTL_MS = 12_000;

export function invalidateActivityCache(itemType: string, itemId: string) {
  activityCache.delete(`${itemType}:${itemId}`);
}

async function fetchActivityCached(
  itemType: string,
  itemId: string,
  force = false
): Promise<ItemActivityResponse> {
  const key = `${itemType}:${itemId}`;
  const cached = activityCache.get(key);
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }
  const data = await api.getInteractionActivity(itemType, itemId);
  activityCache.set(key, { data, fetchedAt: Date.now() });
  return data;
}

function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return '';
  const ts = new Date(isoDate).getTime();
  if (isNaN(ts)) return isoDate;
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  const clean = (name || '').replace(/\(Admin\)/gi, '').trim();
  if (!clean) return 'M';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const TAB_META: Record<
  ActivityTabType,
  { label: string; heading: string; emptyText: string; accentClass: string; icon: React.ComponentType<any> }
> = {
  views: {
    label: 'Views',
    heading: 'Who Viewed (Unique IDs)',
    emptyText: 'Abhi tak kisi ne view nahi kiya hai.',
    accentClass: 'text-[#064E3B]',
    icon: Eye
  },
  likes: {
    label: 'Likes',
    heading: 'Liked By',
    emptyText: 'Abhi tak kisi ne like nahi kiya hai.',
    accentClass: 'text-rose-600',
    icon: Heart
  },
  shares: {
    label: 'Shares',
    heading: 'Shared By',
    emptyText: 'Abhi tak kisi ne share nahi kiya hai.',
    accentClass: 'text-sky-600',
    icon: Share2
  },
  saves: {
    label: 'Saves',
    heading: 'Saved By',
    emptyText: 'Abhi tak kisi ne save nahi kiya hai.',
    accentClass: 'text-amber-600',
    icon: Bookmark
  }
};

interface EngagementActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'reel' | 'speech' | 'website';
  itemId: string;
  itemTitle?: string;
  initialTab?: ActivityTabType;
}

export const EngagementActivityModal: React.FC<EngagementActivityModalProps> = ({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemTitle,
  initialTab = 'views'
}) => {
  const [activeTab, setActiveTab] = useState<ActivityTabType>(initialTab);
  const [data, setData] = useState<ItemActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !itemId) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchActivityCached(itemType, itemId, true)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'Could not load activity details');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, itemType, itemId]);

  if (!isOpen) return null;

  const availableTabs: ActivityTabType[] =
    itemType === 'website' ? ['views'] : ['views', 'likes', 'shares', 'saves'];

  const activeList: ActivityPerson[] = data ? data[activeTab] || [] : [];
  const filteredList = searchQuery.trim()
    ? activeList.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.platform || '').toLowerCase().includes(q) ||
          (p.device_info || '').toLowerCase().includes(q)
        );
      })
    : activeList;

  const meta = TAB_META[activeTab];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-stone-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200 w-full sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#064E3B] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block">
              {itemType === 'website' ? 'Website Visitors' : 'Activity & IDs'}
            </span>
            <h3 className="text-sm font-bold truncate leading-snug">
              {itemTitle || meta.heading}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
            aria-label="Close activity list"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instagram-style Category Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-2 pt-2 gap-1 shrink-0 overflow-x-auto">
          {availableTabs.map((tabKey) => {
            const TabIcon = TAB_META[tabKey].icon;
            const countVal = data?.counts?.[tabKey] ?? 0;
            const isSelected = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`flex-1 min-w-[78px] flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'border-[#064E3B] text-[#064E3B] bg-white rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isSelected ? TAB_META[tabKey].accentClass : ''}`} />
                <span>{TAB_META[tabKey].label}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stone-200/80 text-stone-700 tabular-nums">
                  {countVal.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Filter */}
        <div className="p-3 border-b border-stone-100 bg-white shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${meta.label.toLowerCase()} by name or @id...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>
        </div>

        {/* Scrollable List of User IDs */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 bg-white min-h-[220px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#064E3B]" />
              <span className="text-xs">Loading IDs...</span>
            </div>
          ) : error ? (
            <div className="py-10 px-4 text-center text-xs text-rose-600">{error}</div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-1.5">
              <UserIcon className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs font-medium text-stone-600">
                {searchQuery ? 'No matching IDs found' : meta.emptyText}
              </p>
            </div>
          ) : (
            filteredList.map((person) => (
              <div
                key={person.id}
                className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                      person.viewer_type === 'admin'
                        ? 'bg-[#064E3B] text-[#D4AF37] border-[#D4AF37]/40'
                        : person.viewer_type === 'member'
                          ? 'bg-emerald-50 text-[#064E3B] border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    {person.viewer_type === 'admin' ? (
                      <Shield className="w-4 h-4" />
                    ) : person.viewer_type === 'guest' ? (
                      <Globe className="w-4 h-4" />
                    ) : (
                      getInitials(person.name)
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {person.name}
                      </span>
                      {person.viewer_type === 'admin' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#064E3B]/10 text-[#064E3B] shrink-0">
                          Admin
                        </span>
                      )}
                      {person.platform && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 capitalize shrink-0">
                          {person.platform}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-emerald-700 truncate">
                      {person.handle}
                    </p>
                    {person.email && (
                      <p className="text-[10px] text-stone-400 truncate">{person.email}</p>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0 font-mono">
                  {formatRelativeTime(person.created_at)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 shrink-0">
          <span>
            {filteredList.length} {filteredList.length === 1 ? 'person' : 'people'}
            {activeTab === 'views' ? ' • 1 view per ID' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-md font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatActivityButtonProps {
  itemType: 'reel' | 'speech' | 'website';
  itemId: string;
  itemTitle?: string;
  tab: ActivityTabType;
  count: number;
  icon: React.ReactNode;
  label?: string;
  className?: string;
  countClassName?: string;
  popoverAlign?: 'left' | 'right' | 'center';
  popoverDirection?: 'up' | 'down';
  darkSurface?: boolean;
  onOpenModal?: (tab: ActivityTabType) => void;
}

/**
 * Instagram-style metric trigger:
 * - Mouse hover reveals a floating scrollable popover showing user IDs & names.
 * - Clicking opens either the parent's modal callback or an internal EngagementActivityModal.
 */
export const StatActivityButton: React.FC<StatActivityButtonProps> = ({
  itemType,
  itemId,
  itemTitle,
  tab,
  count,
  icon,
  label,
  className = '',
  countClassName = '',
  popoverAlign = 'left',
  popoverDirection = 'up',
  darkSurface = false,
  onOpenModal
}) => {
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false);
  const [hoverPeople, setHoverPeople] = useState<ActivityPerson[] | null>(null);
  const [hoverLoading, setHoverLoading] = useState(false);

  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!itemId) return;
    openTimerRef.current = window.setTimeout(() => {
      setIsHoverOpen(true);
      setHoverLoading(true);
      fetchActivityCached(itemType, itemId)
        .then((res) => {
          setHoverPeople(res[tab] || []);
        })
        .catch(() => {
          setHoverPeople([]);
        })
        .finally(() => {
          setHoverLoading(false);
        });
    }, 170);
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = window.setTimeout(() => {
      setIsHoverOpen(false);
    }, 180);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsHoverOpen(false);
    if (onOpenModal) {
      onOpenModal(tab);
    } else {
      setIsSelfModalOpen(true);
    }
  };

  const alignClass =
    popoverAlign === 'right'
      ? 'right-0'
      : popoverAlign === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'left-0';

  const verticalClass =
    popoverDirection === 'down' ? 'top-full pt-1.5' : 'bottom-full pb-1.5';

  const meta = TAB_META[tab];

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-90 focus:outline-none ${className}`}
        title={`Hover or click to see ${meta.label} IDs`}
      >
        {icon}
        <span className={`tabular-nums ${countClassName}`}>
          {count.toLocaleString()}
          {label ? ` ${label}` : ''}
        </span>
      </button>

      {/* Instagram-style Hover Scroll Popover */}
      {isHoverOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          className={`hidden sm:block absolute z-[90] w-64 ${alignClass} ${verticalClass}`}
        >
          <div
            className={`rounded-xl shadow-2xl border overflow-hidden ${
              darkSurface
                ? 'bg-stone-950/95 border-white/15 text-white backdrop-blur-md'
                : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div
              className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-bold ${
                darkSurface
                  ? 'border-white/10 bg-white/5 text-[#D4AF37]'
                  : 'border-stone-100 bg-stone-50 text-[#064E3B]'
              }`}
            >
              <span>{meta.heading}</span>
              <span className="font-mono text-[10px] opacity-80 tabular-nums">
                {count.toLocaleString()}
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-stone-500/10">
              {hoverLoading && !hoverPeople ? (
                <div className="py-5 flex items-center justify-center gap-1.5 text-[11px] opacity-70">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading IDs...</span>
                </div>
              ) : !hoverPeople || hoverPeople.length === 0 ? (
                <div className="py-5 px-3 text-center text-[11px] opacity-70">
                  {meta.emptyText}
                </div>
              ) : (
                hoverPeople.slice(0, 25).map((person) => (
                  <div
                    key={person.id}
                    className={`px-3 py-2 flex items-center justify-between gap-2 text-left ${
                      darkSurface ? 'hover:bg-white/5' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          darkSurface
                            ? 'bg-[#064E3B] text-[#D4AF37]'
                            : 'bg-emerald-50 text-[#064E3B] border border-emerald-200'
                        }`}
                      >
                        {getInitials(person.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold truncate leading-tight">
                          {person.name}
                        </p>
                        <p
                          className={`text-[10px] font-mono truncate leading-tight ${
                            darkSurface ? 'text-[#D4AF37]/90' : 'text-emerald-700'
                          }`}
                        >
                          {person.handle}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] opacity-60 font-mono whitespace-nowrap shrink-0">
                      {formatRelativeTime(person.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleClick}
              className={`w-full px-3 py-1.5 text-[10px] font-bold flex items-center justify-center gap-1 border-t cursor-pointer transition-colors ${
                darkSurface
                  ? 'border-white/10 bg-white/5 text-[#D4AF37] hover:bg-white/10'
                  : 'border-stone-100 bg-stone-50 text-[#064E3B] hover:bg-emerald-50'
              }`}
            >
              <span>See Full {meta.label} List</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Standalone Modal if parent did not supply onOpenModal */}
      {!onOpenModal && isSelfModalOpen && (
        <EngagementActivityModal
          isOpen={isSelfModalOpen}
          onClose={() => setIsSelfModalOpen(false)}
          itemType={itemType}
          itemId={itemId}
          itemTitle={itemTitle}
          initialTab={tab}
        />
      )}
    </div>
  );
};
