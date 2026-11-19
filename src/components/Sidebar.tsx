import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  BellRing,
  BookCopy,
  BookOpen,
  LogOut,
  Repeat,
  Users,
  X,
} from 'lucide-react';
import type { LibrarianPublic } from '../types/library';

export type NavTab = 'analytics' | 'circulation' | 'catalog' | 'visitors' | 'notifications';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentLibrarian: LibrarianPublic;
  librarians: LibrarianPublic[];
  onSwitchLibrarian: (librarianId: LibrarianPublic['id']) => void;
  onLogout: () => void;
  overdueCount: number;
  lowStockCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  currentLibrarian,
  librarians,
  onSwitchLibrarian,
  onLogout,
  overdueCount,
  lowStockCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const otherLibrarian = librarians.find((l) => l.id !== currentLibrarian.id);

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    counter?: number;
    counterTone?: 'danger' | 'warning';
  }> = [
    { id: 'analytics', label: 'Dashboard Analitik', icon: BarChart3 },
    { id: 'circulation', label: 'Sirkulasi Digital', icon: ArrowLeftRight },
    {
      id: 'catalog',
      label: 'Katalog & Stok',
      icon: BookCopy,
      counter: lowStockCount > 0 ? lowStockCount : undefined,
      counterTone: 'warning',
    },
    { id: 'visitors', label: 'Pengunjung Harian', icon: Users },
    {
      id: 'notifications',
      label: 'Notifikasi Denda',
      icon: BellRing,
      counter: overdueCount > 0 ? overdueCount : undefined,
      counterTone: 'danger',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0E1B18] text-slate-200 border-r border-[#1C2F2A] w-64">
      {/* Brand Wordmark */}
      <div className="h-16 px-5 border-b border-[#1C2F2A] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
            PustakaNusa
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu navigasi"
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#182B26]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Menu utama">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                active
                  ? 'bg-[#17302A] text-white'
                  : 'text-slate-300 hover:text-white hover:bg-[#142521]'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${active ? 'text-teal-400' : 'text-slate-400'}`}
                />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </span>
              {item.counter !== undefined && (
                <span
                  className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                    item.counterTone === 'danger' ? 'text-rose-400' : 'text-amber-300'
                  }`}
                >
                  {item.counter}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Librarian & Quick Switch */}
      <div className="p-4 border-t border-[#1C2F2A] bg-[#0B1513] space-y-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center font-display text-xs font-bold shrink-0">
            {currentLibrarian.initials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {currentLibrarian.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">{currentLibrarian.role}</div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {otherLibrarian && (
            <button
              type="button"
              onClick={() => onSwitchLibrarian(otherLibrarian.id)}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-200 bg-[#152622] border border-[#233B35] rounded-lg hover:bg-[#1B312C] transition-colors flex items-center gap-2 truncate cursor-pointer"
              title={`Beralih ke akun ${otherLibrarian.name}`}
            >
              <Repeat className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Ganti ke {otherLibrarian.name.split(',')[0]}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
