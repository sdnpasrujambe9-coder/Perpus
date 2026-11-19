import React from 'react';
import { Bell, Menu, Plus, UserPlus } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface TopBarProps {
  activeTab: NavTab;
  overdueCount: number;
  onOpenMobileMenu: () => void;
  onOpenLoanModal: () => void;
  onOpenVisitorModal: () => void;
  onOpenNotifications: () => void;
}

const TAB_LABELS: Record<NavTab, string> = {
  analytics: 'Dashboard Analitik Pengunjung',
  circulation: 'Sirkulasi Peminjaman & Pengembalian',
  catalog: 'Katalog & Pelacakan Stok Otomatis',
  visitors: 'Log Pengunjung Harian',
  notifications: 'Sistem Notifikasi Denda Keterlambatan',
};

export function TopBar({
  activeTab,
  overdueCount,
  onOpenMobileMenu,
  onOpenLoanModal,
  onOpenVisitorModal,
  onOpenNotifications,
}: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Zone 1: Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu navigasi"
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-400 hidden sm:inline whitespace-nowrap">PustakaNusa</span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-slate-900 truncate">
            {TAB_LABELS[activeTab]}
          </h1>
        </div>
      </div>

      {/* Zone 2: Functional Controls & Primary Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label={`Lihat ${overdueCount} notifikasi denda keterlambatan`}
          className={`relative px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            overdueCount > 0
              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span className="hidden md:inline">Denda</span>
          <span className="font-mono tabular-nums font-semibold">{overdueCount}</span>
        </button>

        <button
          type="button"
          onClick={onOpenVisitorModal}
          className="hidden sm:flex px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-slate-500" />
          <span>Catat Pengunjung</span>
        </button>

        <button
          type="button"
          onClick={onOpenLoanModal}
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Peminjaman</span>
        </button>
      </div>
    </header>
  );
}
