import React, { useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import type { DashboardAnalytics, VisitorCategory, VisitorLog } from '../types/library';
import { formatDateShort, formatNumber, formatTimeOnly } from '../lib/format';

interface VisitorsViewProps {
  visitors: VisitorLog[];
  analytics: DashboardAnalytics;
  onOpenVisitorModal: () => void;
}

export function VisitorsView({
  visitors,
  analytics,
  onOpenVisitorModal,
}: VisitorsViewProps) {
  const [dateRange, setDateRange] = useState<'today' | '7d' | 'all'>('today');
  const [categoryFilter, setCategoryFilter] = useState<'all' | VisitorCategory>('all');
  const [query, setQuery] = useState('');

  const filteredVisitors = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return visitors.filter((v) => {
      if (dateRange === 'today' && v.dateKey !== analytics.todayDateKey) return false;
      if (dateRange === '7d' && new Date(v.visitedAt) < sevenDaysAgo) return false;
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        v.visitorName.toLowerCase().includes(q) ||
        v.memberId.toLowerCase().includes(q) ||
        v.purpose.toLowerCase().includes(q)
      );
    });
  }, [visitors, dateRange, categoryFilter, query, analytics.todayDateKey]);

  return (
    <div className="space-y-5">
      {/* Daily Category Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.categoryBreakdown.map((item) => (
          <div key={item.category} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">{item.category} (Hari Ini)</div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {formatNumber(item.count)}
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'today', label: `Hari Ini (${analytics.visitorsToday})` },
                { id: '7d', label: '7 Hari Terakhir' },
                { id: 'all', label: `Semua (${visitors.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateRange(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  dateRange === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | VisitorCategory)}
            aria-label="Filter kategori pengunjung"
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">Semua Kategori</option>
            <option value="Pelajar">Pelajar</option>
            <option value="Mahasiswa">Mahasiswa</option>
            <option value="Umum">Umum</option>
            <option value="Peneliti">Peneliti</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau ID anggota..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
          <button
            type="button"
            onClick={onOpenVisitorModal}
            className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Catat Pengunjung</span>
          </button>
        </div>
      </div>

      {/* Visitor Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredVisitors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              Belum ada data pengunjung pada filter ini
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Catat kunjungan baru untuk memantau aktivitas harian perpustakaan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                  <th className="py-3 px-4 font-medium">Waktu Masuk</th>
                  <th className="py-3 px-4 font-medium">Nama Pengunjung</th>
                  <th className="py-3 px-4 font-medium">ID Anggota</th>
                  <th className="py-3 px-4 font-medium">Kategori</th>
                  <th className="py-3 px-4 font-medium">Keperluan Kunjungan</th>
                  <th className="py-3 px-4 font-medium">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisitors.slice(0, 100).map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-700">
                      {formatDateShort(visitor.visitedAt)} <span aria-hidden="true">·</span>{' '}
                      {formatTimeOnly(visitor.visitedAt)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{visitor.visitorName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{visitor.memberId}</td>
                    <td className="py-3 px-4 text-slate-700">{visitor.category}</td>
                    <td className="py-3 px-4 text-slate-700">{visitor.purpose}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {visitor.recordedByName.split(',')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
