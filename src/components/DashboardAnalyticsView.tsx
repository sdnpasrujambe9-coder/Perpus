import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookCopy,
  BookOpenCheck,
  Coins,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import type {
  Book,
  DashboardAnalytics,
  EnrichedLoan,
  LibrarianPublic,
  VisitorLog,
} from '../types/library';
import { formatNumber, formatRupiah, formatTimeOnly } from '../lib/format';
import type { NavTab } from './Sidebar';

interface DashboardAnalyticsViewProps {
  analytics: DashboardAnalytics;
  currentLibrarian: LibrarianPublic;
  loans: EnrichedLoan[];
  books: Book[];
  visitors: VisitorLog[];
  onNavigate: (tab: NavTab) => void;
  onOpenVisitorModal: () => void;
  onOpenLoanModal: () => void;
}

export function DashboardAnalyticsView({
  analytics,
  currentLibrarian,
  loans,
  books,
  visitors,
  onNavigate,
  onOpenVisitorModal,
  onOpenLoanModal,
}: DashboardAnalyticsViewProps) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visibleSeries = useMemo(
    () => analytics.dailySeries.slice(-rangeDays),
    [analytics.dailySeries, rangeDays],
  );

  const maxDailyVisitor = useMemo(() => {
    const peak = Math.max(...visibleSeries.map((d) => d.visitors), 10);
    return Math.ceil(peak / 5) * 5;
  }, [visibleSeries]);

  const maxHourlyVisitor = useMemo(
    () => Math.max(...analytics.hourlyToday.map((h) => h.visitors), 4),
    [analytics.hourlyToday],
  );

  const visitorDelta = analytics.visitorsToday - analytics.visitorsYesterday;
  const overdueLoans = useMemo(
    () => loans.filter((l) => l.status === 'active' && l.isOverdue).slice(0, 4),
    [loans],
  );
  const lowStockBooks = useMemo(
    () => books.filter((b) => b.availableStock <= 2).slice(0, 5),
    [books],
  );
  const todayVisitors = useMemo(
    () => visitors.filter((v) => v.dateKey === analytics.todayDateKey).slice(0, 6),
    [visitors, analytics.todayDateKey],
  );

  const peakHourPoint = useMemo(() => {
    return analytics.hourlyToday.reduce(
      (best, cur) => (cur.visitors > best.visitors ? cur : best),
      analytics.hourlyToday[0] || { hour: 9, label: '09:00', visitors: 0 },
    );
  }, [analytics.hourlyToday]);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const chartWidth = 760;
  const chartHeight = 240;
  const padLeft = 36;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 34;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const polylinePoints = useMemo(() => {
    const slotW = plotW / Math.max(1, visibleSeries.length);
    return visibleSeries.map((pt, idx) => {
      const x = padLeft + slotW * idx + slotW / 2;
      const y = padTop + plotH - (pt.visitors / maxDailyVisitor) * plotH;
      return { x, y, pt };
    });
  }, [visibleSeries, plotW, plotH, maxDailyVisitor]);

  const linePath = useMemo(() => {
    if (polylinePoints.length === 0) return '';
    return polylinePoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  }, [polylinePoints]);

  const areaPath = useMemo(() => {
    if (polylinePoints.length === 0) return '';
    const first = polylinePoints[0];
    const last = polylinePoints[polylinePoints.length - 1];
    const bottomY = padTop + plotH;
    return `${linePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
  }, [linePath, polylinePoints, plotH]);

  const hoveredPoint = hoveredIdx !== null ? polylinePoints[hoveredIdx] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Editorial Daily Desk Banner */}
      <section className="bg-white border border-[#DCE3DF] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-medium text-teal-800">
            {todayFormatted} <span aria-hidden="true">·</span> {currentLibrarian.shift}
          </div>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#111C19] [text-wrap:balance]">
            Selamat bertugas, {currentLibrarian.name.split(',')[0]}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
            Pantau arus pengunjung harian, sirkulasi peminjaman Rp 1.000/buku, ketersediaan stok otomatis, serta pengingat denda keterlambatan secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenVisitorModal}
            className="px-4 py-2.5 rounded-xl border border-[#DCE3DF] bg-[#F8FAF9] hover:bg-[#EEF2F0] text-[#111C19] text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Users className="w-4 h-4 text-teal-700" />
            <span>Check-in Pengunjung</span>
          </button>
          <button
            type="button"
            onClick={onOpenLoanModal}
            className="px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Transaksi Peminjaman</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* KPI Strip (4 columns, clean icon affordance, tabular-nums) */}
      <section
        aria-label="Ringkasan metrik harian"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-[#DCE3DF] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pengunjung Hari Ini</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-semibold text-[#111C19] tabular-nums">
              {formatNumber(analytics.visitorsToday)}
            </span>
            <span
              className={`text-xs font-mono tabular-nums font-medium ${
                visitorDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {visitorDelta >= 0 ? `+${visitorDelta}` : visitorDelta} vs kemarin
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Jam paling ramai</span>
            <span className="font-mono tabular-nums text-[#111C19] font-medium">
              {peakHourPoint.label} ({peakHourPoint.visitors} org)
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DCE3DF] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Buku Sedang Dipinjam</span>
            <BookOpenCheck className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-semibold text-[#111C19] tabular-nums">
              {formatNumber(analytics.booksCurrentlyBorrowed)}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {analytics.activeLoansCount} transaksi aktif
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Stok tersedia</span>
            <span className="font-mono tabular-nums text-[#111C19] font-medium">
              {analytics.availableStockUnits} / {analytics.totalStockUnits} eks.
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DCE3DF] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pendapatan Sewa & Denda</span>
            <Coins className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-semibold text-[#111C19] tabular-nums">
              {formatRupiah(analytics.totalLoanRevenue + analytics.totalCollectedFines)}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Tarif Rp 1.000 / buku</span>
            <span className="font-mono tabular-nums text-teal-800 font-medium">
              Hari ini {formatRupiah(analytics.todayLoanRevenue)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DCE3DF] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Denda Keterlambatan</span>
            <BellRing
              className={`w-4 h-4 ${
                analytics.overdueLoansCount > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span
              className={`font-mono text-2xl sm:text-3xl font-semibold tabular-nums ${
                analytics.overdueLoansCount > 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {formatRupiah(analytics.pendingFinesTotal)}
            </span>
            <span
              className={`text-xs font-semibold ${
                analytics.overdueLoansCount > 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {analytics.overdueLoansCount > 0
                ? `${analytics.overdueLoansCount} terlambat`
                : 'Semua lancar'}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Jatuh tempo dekat</span>
            <span className="font-mono tabular-nums text-amber-700 font-medium">
              {analytics.dueSoonLoansCount} transaksi
            </span>
          </div>
        </div>
      </section>

      {/* Main Analytics Grid: Interactive Daily Chart + Purpose & Hourly Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8 bg-white border border-[#DCE3DF] rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#111C19]">
                Aktivitas Pengunjung & Peminjaman Harian
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Arahkan kursor pada grafik untuk melihat detail kunjungan dan sirkulasi per tanggal
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#EEF2F0] rounded-lg self-start sm:self-auto">
              {([7, 14, 30] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    rangeDays === days
                      ? 'bg-white text-[#111C19] shadow-xs'
                      : 'text-slate-600 hover:text-[#111C19]'
                  }`}
                >
                  {days} Hari
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-60 sm:h-68 min-w-[560px]"
              role="img"
              aria-label="Grafik aktivitas pengunjung harian"
            >
              <defs>
                <linearGradient id="visitorAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F766E" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padTop + plotH - ratio * plotH;
                const val = Math.round(ratio * maxDailyVisitor);
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={chartWidth - padRight}
                      y2={y}
                      stroke="#E2E7E4"
                      strokeDasharray={ratio === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area gradient fill */}
              {areaPath && <path d={areaPath} fill="url(#visitorAreaGrad)" />}

              {/* Hover crosshair guide line */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={padTop}
                  x2={hoveredPoint.x}
                  y2={padTop + plotH}
                  stroke="#0F766E"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
              )}

              {/* Bars */}
              {polylinePoints.map(({ x, pt }, idx) => {
                const slotW = plotW / Math.max(1, visibleSeries.length);
                const barW = Math.max(8, Math.min(22, slotW * 0.48));
                const barH = (pt.visitors / maxDailyVisitor) * plotH;
                const barY = padTop + plotH - barH;
                const loanH = (pt.loans / maxDailyVisitor) * plotH;
                const loanY = padTop + plotH - loanH;
                const isToday = pt.dateKey === analytics.todayDateKey;
                const isHovered = hoveredIdx === idx;
                const showLabel =
                  visibleSeries.length <= 14 || idx % 3 === 0 || idx === visibleSeries.length - 1;

                return (
                  <g
                    key={pt.dateKey}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x - slotW / 2}
                      y={padTop}
                      width={slotW}
                      height={plotH}
                      fill="transparent"
                    />
                    <rect
                      x={x - barW / 2}
                      y={barY}
                      width={barW}
                      height={Math.max(3, barH)}
                      rx={4}
                      fill={isToday ? '#0F766E' : isHovered ? '#14B8A6' : '#CBD5E1'}
                      opacity={isToday || isHovered ? 0.92 : 0.72}
                    />
                    {pt.loans > 0 && (
                      <rect
                        x={x - barW / 2 + barW * 0.28}
                        y={loanY}
                        width={Math.max(4, barW * 0.44)}
                        height={Math.max(3, loanH)}
                        rx={2}
                        fill="#0E1B18"
                      />
                    )}
                    {showLabel && (
                      <text
                        x={x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className={`text-[10px] font-mono ${
                          isToday ? 'fill-teal-800 font-semibold' : 'fill-slate-400'
                        }`}
                      >
                        {isToday ? 'Hari Ini' : pt.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Smooth Trend Polyline + Nodes */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              )}
              {polylinePoints.map(({ x, y, pt }, idx) => {
                const isToday = pt.dateKey === analytics.todayDateKey;
                const isHovered = hoveredIdx === idx;
                if (!isToday && !isHovered && visibleSeries.length > 14) return null;
                return (
                  <circle
                    key={`dot-${pt.dateKey}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : isToday ? 4.5 : 2.5}
                    fill={isHovered || isToday ? '#0F766E' : '#FFFFFF'}
                    stroke="#0F766E"
                    strokeWidth="2"
                    pointerEvents="none"
                  />
                );
              })}

              {/* Interactive SVG Tooltip */}
              {hoveredPoint && (
                <g
                  pointerEvents="none"
                  transform={`translate(${Math.min(
                    chartWidth - 175,
                    Math.max(padLeft + 6, hoveredPoint.x - 82),
                  )}, ${Math.max(6, hoveredPoint.y - 54)})`}
                >
                  <rect width="166" height="44" rx="8" fill="#0E1B18" />
                  <text
                    x="10"
                    y="17"
                    className="fill-teal-300 text-[10px] font-mono font-semibold"
                  >
                    {hoveredPoint.pt.dateKey === analytics.todayDateKey
                      ? 'Hari Ini'
                      : hoveredPoint.pt.label}
                  </text>
                  <text x="10" y="33" className="fill-white text-[10px] font-mono">
                    {hoveredPoint.pt.visitors} kunj · {hoveredPoint.pt.loans} pinjam ·{' '}
                    {hoveredPoint.pt.returns} kmb
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="mt-3 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#0F766E] inline-block" />
                <span>Pengunjung Hari Ini</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block" />
                <span>Pengunjung Harian</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#0E1B18] inline-block" />
                <span>Transaksi Pinjam</span>
              </span>
            </div>
            <div className="font-mono tabular-nums text-[#111C19] font-medium">
              Total {rangeDays} hari:{' '}
              {formatNumber(visibleSeries.reduce((s, d) => s + d.visitors, 0))} kunjungan
            </div>
          </div>
        </section>

        {/* Purpose & Hourly Distribution */}
        <section className="xl:col-span-4 bg-white border border-[#DCE3DF] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="font-display text-lg font-semibold text-[#111C19]">
                Keperluan & Jam Masuk
              </h2>
              <button
                type="button"
                onClick={onOpenVisitorModal}
                className="text-xs font-semibold text-teal-800 hover:text-teal-900 whitespace-nowrap cursor-pointer"
              >
                + Check-in
              </button>
            </div>

            <div className="space-y-3.5">
              {analytics.purposeBreakdown.map((item) => (
                <div key={item.purpose} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#111C19] font-medium">{item.purpose}</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#EEF2F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#111C19]">
                Distribusi Jam Masuk Hari Ini
              </span>
              <span className="text-[11px] font-mono text-slate-400">08:00–17:00</span>
            </div>
            <div className="grid grid-cols-10 gap-1.5 items-end h-22">
              {analytics.hourlyToday.map((slot) => {
                const heightPct = Math.max(8, Math.round((slot.visitors / maxHourlyVisitor) * 100));
                const isPeak = slot.hour === peakHourPoint.hour && slot.visitors > 0;
                return (
                  <div
                    key={slot.hour}
                    className="flex flex-col items-center justify-end h-full gap-1.5"
                    title={`${slot.label}: ${slot.visitors} pengunjung`}
                  >
                    <div className="w-full bg-[#EEF2F0] rounded-xs flex items-end h-16 overflow-hidden">
                      <div
                        className={`w-full rounded-xs transition-all ${
                          isPeak
                            ? 'bg-[#0F766E]'
                            : slot.visitors > 0
                              ? 'bg-[#0E1B18]'
                              : 'bg-slate-200'
                        }`}
                        style={{ height: `${slot.visitors > 0 ? heightPct : 6}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400">
                      {String(slot.hour).padStart(2, '0')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Lower Grid: 2 Librarians + Overdue + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2 Librarians Activity & Today Visitor Feed */}
        <section className="lg:col-span-5 bg-white border border-[#DCE3DF] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-display text-lg font-semibold text-[#111C19]">
              Kinerja 2 Pustakawan
            </h2>
            <span className="text-xs text-slate-500">Rekap aktivitas sesi</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics.librarianStats.map((stat) => (
              <div key={stat.librarianId} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-[#111C19]">{stat.name}</div>
                    <div className="text-xs text-slate-500">{stat.role}</div>
                  </div>
                  <div className="text-right font-mono text-xs tabular-nums font-semibold text-teal-800">
                    {stat.loansProcessed + stat.returnsProcessed} sirkulasi
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#F4F6F5] rounded-lg px-2.5 py-2">
                    <div className="text-slate-500 text-[11px]">Pinjam</div>
                    <div className="font-mono font-semibold tabular-nums text-[#111C19] mt-0.5">
                      {stat.loansProcessed}
                    </div>
                  </div>
                  <div className="bg-[#F4F6F5] rounded-lg px-2.5 py-2">
                    <div className="text-slate-500 text-[11px]">Kembali</div>
                    <div className="font-mono font-semibold tabular-nums text-[#111C19] mt-0.5">
                      {stat.returnsProcessed}
                    </div>
                  </div>
                  <div className="bg-[#F4F6F5] rounded-lg px-2.5 py-2">
                    <div className="text-slate-500 text-[11px]">Pengunjung</div>
                    <div className="font-mono font-semibold tabular-nums text-[#111C19] mt-0.5">
                      {stat.visitorsLogged}
                    </div>
                  </div>
                  <div className="bg-[#F4F6F5] rounded-lg px-2.5 py-2">
                    <div className="text-slate-500 text-[11px]">Notifikasi</div>
                    <div className="font-mono font-semibold tabular-nums text-[#111C19] mt-0.5">
                      {stat.notificationsSent}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#111C19]">
                Kunjungan Terbaru Hari Ini
              </span>
              <button
                type="button"
                onClick={() => onNavigate('visitors')}
                className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {todayVisitors.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada pengunjung tercatat hari ini.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayVisitors.slice(0, 4).map((v) => (
                  <div key={v.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-medium text-[#111C19] truncate block">
                        {v.visitorName}
                      </span>
                      <span className="text-slate-500">
                        {v.category} <span aria-hidden="true">·</span> {v.purpose}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-500 shrink-0">
                      {formatTimeOnly(v.visitedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Actionable Overdue & Low Stock */}
        <section className="lg:col-span-7 grid grid-cols-1 gap-6">
          <div className="bg-white border border-[#DCE3DF] rounded-2xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-red-600" />
                <h2 className="font-display text-lg font-semibold text-[#111C19]">
                  Peringatan Denda Keterlambatan
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('notifications')}
                className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Kelola Notifikasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {overdueLoans.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-[#DCE3DF] rounded-xl">
                Tidak ada peminjaman terlambat saat ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3 font-medium">Peminjam</th>
                      <th className="py-2 px-3 font-medium">Buku</th>
                      <th className="py-2 px-3 font-medium text-right">Telat</th>
                      <th className="py-2 pl-3 font-medium text-right">Denda Berjalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-[#111C19]">{loan.borrowerName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{loan.code}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                          {loan.items.map((i) => i.title).join(', ')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-red-600">
                          {loan.currentLateDays} hr
                        </td>
                        <td className="py-3 pl-3 text-right font-mono tabular-nums font-semibold text-red-600">
                          {formatRupiah(loan.currentLateFine)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#DCE3DF] rounded-2xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <BookCopy className="w-4 h-4 text-amber-700" />
                <h2 className="font-display text-lg font-semibold text-[#111C19]">
                  Pelacakan Stok Menipis & Habis
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Katalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lowStockBooks.length === 0 ? (
              <div className="py-5 text-center text-xs text-slate-500 border border-dashed border-[#DCE3DF] rounded-xl">
                Semua judul buku memiliki stok aman (&gt; 2 eksemplar tersedia).
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockBooks.map((book) => (
                  <div
                    key={book.id}
                    className="py-2.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#111C19] truncate">{book.title}</div>
                      <div className="text-slate-500">
                        {book.shelfCode} <span aria-hidden="true">·</span> {book.author}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          book.availableStock === 0 ? 'text-red-600' : 'text-amber-700'
                        }`}
                      >
                        Sisa {book.availableStock}
                      </span>
                      <span className="text-slate-400"> / {book.totalStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
