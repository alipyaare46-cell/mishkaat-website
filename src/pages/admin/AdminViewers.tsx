import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Eye,
  UserCheck,
  Users,
  Globe,
  Film,
  Search,
  RefreshCw,
  Trash2,
  Monitor,
  Info,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Reel, ViewLogItem, ViewersResponse } from '../../types';

interface AdminViewersProps {
  reels: Reel[];
}

type ViewerFilter = 'all' | 'website' | 'reel' | 'members';

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return iso;
  }
}

export const AdminViewers: React.FC<AdminViewersProps> = ({ reels }) => {
  const [data, setData] = useState<ViewersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ViewerFilter>('all');
  const [selectedReelId, setSelectedReelId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const loadViewers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: {
        target_type?: string;
        target_id?: string;
        viewer_type?: string;
        limit?: number;
      } = { limit: 300 };

      if (filter === 'website') params.target_type = 'website';
      if (filter === 'reel') params.target_type = 'reel';
      if (filter === 'members') params.viewer_type = 'member';
      if (selectedReelId) {
        params.target_type = 'reel';
        params.target_id = selectedReelId;
      }

      const res = await api.getAdminViewers(params);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load viewer logs');
    } finally {
      setIsLoading(false);
    }
  }, [filter, selectedReelId]);

  useEffect(() => {
    loadViewers();
  }, [loadViewers]);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await api.clearAdminViewers();
      setConfirmClear(false);
      await loadViewers();
    } catch (err: any) {
      setError(err.message || 'Failed to clear viewer logs');
    } finally {
      setIsClearing(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const logs = data?.logs || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log: ViewLogItem) => {
      return (
        (log.viewer_name || '').toLowerCase().includes(q) ||
        (log.viewer_email || '').toLowerCase().includes(q) ||
        (log.target_title || '').toLowerCase().includes(q) ||
        (log.device_info || '').toLowerCase().includes(q) ||
        (log.ip_address || '').toLowerCase().includes(q) ||
        (log.page_path || '').toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            Viewer Activity &amp; Who Viewed
          </h2>
          <p className="text-xs text-stone-500">
            See signed-in members by name and Gmail, plus device, browser, and page details for website &amp; reel views.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadViewers}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={!data || data.logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-semibold text-rose-800">Confirm?</span>
              <button
                type="button"
                onClick={handleClearLogs}
                disabled={isClearing}
                className="px-2 py-1 text-[11px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
              >
                {isClearing ? 'Clearing...' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transparency / How Viewer Identification Works Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#064E3B] border border-emerald-200 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-stone-600 leading-relaxed">
          <p className="font-bold text-stone-900">How Viewer Tracking Works</p>
          <p className="mt-0.5">
            Visitors who are signed into their MISHKAAT account appear with their{' '}
            <span className="font-semibold text-[#064E3B]">Full Name and Gmail</span>.
            Public visitors who have not signed in appear as{' '}
            <span className="font-semibold text-stone-800">Guest Visitor</span> along with their Device/Browser, Page visited, IP address, and exact timestamp.
          </p>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Signed-In Views</span>
            <UserCheck className="w-4 h-4 text-[#064E3B]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
            {(summary?.memberViews ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Unique Members</span>
            <Users className="w-4 h-4 text-[#064E3B]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900">
            {(summary?.uniqueMembers ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Guest Visits</span>
            <Monitor className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900">
            {(summary?.guestViews ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Website Visits</span>
            <Globe className="w-4 h-4 text-[#064E3B]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900">
            {(summary?.websiteViewLogs ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Reels Watched</span>
            <Film className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900">
            {(summary?.reelViewLogs ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg self-start">
          {[
            { id: 'all', label: 'All Views' },
            { id: 'website', label: 'Website Visits' },
            { id: 'reel', label: 'Reels Watched' },
            { id: 'members', label: 'Members Only' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilter(tab.id as ViewerFilter);
                if (tab.id === 'website') setSelectedReelId('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filter === tab.id && !selectedReelId
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl justify-end">
          {reels.length > 0 && (
            <div className="relative">
              <select
                value={selectedReelId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedReelId(val);
                  if (val) setFilter('reel');
                }}
                className="w-full sm:w-52 px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
                aria-label="Filter by specific reel"
              >
                <option value="">All Reels &amp; Pages</option>
                {reels.map((r) => (
                  <option key={r.id} value={r.id}>
                    Reel: {r.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, Gmail, device, IP..."
              className="w-full pl-8 pr-8 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Viewer Activity Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Viewer</th>
                <th className="py-3 px-4">Viewed Content</th>
                <th className="py-3 px-4">Device &amp; Browser</th>
                <th className="py-3 px-4">Page / IP</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-3.5 w-32 bg-stone-200 rounded mb-1.5" />
                      <div className="h-2.5 w-40 bg-stone-100 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-3.5 w-36 bg-stone-200 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-3.5 w-28 bg-stone-100 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-3.5 w-24 bg-stone-100 rounded" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-3.5 w-28 bg-stone-100 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center text-stone-500">
                    <Eye className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">No viewer activity recorded yet</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      When visitors open MISHKAAT or watch an Islamic Reel, their details will appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isIdentified = log.viewer_type !== 'guest';
                  return (
                    <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">
                          {log.viewer_name || 'Guest Visitor'}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                          {isIdentified ? (
                            <>
                              <span className="font-medium text-[#064E3B]">
                                {log.viewer_type === 'admin' ? 'Admin' : 'Member'}
                              </span>
                              {log.viewer_email && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-stone-600">{log.viewer_email}</span>
                                </>
                              )}
                            </>
                          ) : (
                            <span>Unauthenticated Guest</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-900 max-w-xs truncate">
                          {log.target_title || (log.target_type === 'reel' ? 'Islamic Reel' : 'MISHKAAT Website')}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {log.target_type === 'reel' ? 'Islamic Reel Play' : 'Website Visit'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-700 whitespace-nowrap">
                        {log.device_info || 'Unknown Device'}
                      </td>

                      <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                        <div className="font-mono text-[11px]">{log.page_path || '/'}</div>
                        <div className="font-mono text-[10px] text-stone-400 mt-0.5 tabular-nums">
                          {log.ip_address || 'unknown'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right text-stone-600 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        {formatTimestamp(log.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
