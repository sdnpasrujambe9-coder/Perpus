import React, { useMemo, useState } from 'react';
import { ArrowRight, BellRing, BookCopy, Users } from 'lucide-react';
import type { Book, DashboardAnalytics, EnrichedLoan, VisitorLog } from '../types/library';
import { formatNumber, formatRupiah, formatTimeOnly } from '../lib/format';
import type { NavTab } from './Sidebar';

interface DashboardAnalyticsViewProps {
  analytics: DashboardAnalytics;
  loans: EnrichedLoan[];
  books: Book[];
  visitors: VisitorLog[];
  onNavigate: (tab: NavTab) => void;
  onOpenVisitorModal: () => void;
}

export function DashboardAnalyticsView({
  analytics,
  loans,
  books,
  visitors,
  onNavigate,
  onOpenVisitorModal,
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

  const chartWidth = 760;
  const chartHeight = 230;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 34;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  return (
    <div className="space-y-6">
      {/* KPI Strip (4 columns, single-elevation flat borders, tabular-nums) */}
      <section aria-label="Ringkasan metrik harian" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Pengunjung Hari Ini</div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatNumber(analytics.visitorsToday)}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {visitorDelta >= 0 ? `+${visitorDelta}` : visitorDelta} vs kemarin
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Jam puncak <span className="font-mono tabular-nums text-slate-700">{peakHourPoint.label}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Sirkulasi Buku Aktif</div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatNumber(analytics.booksCurrentlyBorrowed)}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {analytics.activeLoansCount} transaksi
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Stok tersedia{' '}
            <span className="font-mono tabular-nums text-slate-700">
              {analytics.availableStockUnits}/{analytics.totalStockUnits} eks.
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Pendapatan Sewa & Denda</div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatRupiah(analytics.totalLoanRevenue + analytics.totalCollectedFines)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Tarif <span className="font-mono tabular-nums text-slate-700">Rp 1.000/buku</span> · Hari ini{' '}
            <span className="font-mono tabular-nums text-slate-700">
              {formatRupiah(analytics.todayLoanRevenue)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Denda Keterlambatan Aktif</div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span
              className={`font-mono text-2xl font-semibold tabular-nums ${
                analytics.overdueLoansCount > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {formatRupiah(analytics.pendingFinesTotal)}
            </span>
            <span
              className={`text-xs font-medium ${
                analytics.overdueLoansCount > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {analytics.overdueLoansCount > 0
                ? `${analytics.overdueLoansCount} terlambat`
                : 'Semua lancar'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Jatuh tempo dekat:{' '}
            <span className="font-mono tabular-nums text-amber-700">
              {analytics.dueSoonLoansCount} transaksi
            </span>
          </div>
        </div>
      </section>

      {/* Main Analytics Grid: Daily Visitor Trend + Purpose & Hourly Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Daily Visitor & Loan Activity Chart */}
        <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Aktivitas Pengunjung & Peminjaman Harian
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau tren kunjungan harian dan transaksi peminjaman buku perpustakaan
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
              {([7, 14, 30] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    rangeDays === days
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {days} Hari
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Chart */}
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 sm:h-64 min-w-[540px]"
              role="img"
              aria-label="Grafik aktivitas pengunjung harian"
            >
              {/* Horizontal grid lines */}
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
                      stroke="#e2e8f0"
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

              {/* Bars for visitors + secondary bar for loans */}
              {visibleSeries.map((pt, idx) => {
                const slotW = plotW / visibleSeries.length;
                const barW = Math.max(8, Math.min(24, slotW * 0.54));
                const xCenter = padLeft + slotW * idx + slotW / 2;
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
                      x={xCenter - slotW / 2}
                      y={padTop}
                      width={slotW}
                      height={plotH}
                      fill={isHovered ? '#f1f5f9' : 'transparent'}
                      rx={4}
                    />
                    <rect
                      x={xCenter - barW / 2}
                      y={barY}
                      width={barW}
                      height={Math.max(2, barH)}
                      rx={3}
                      fill={isToday ? '#1d4ed8' : isHovered ? '#3b82f6' : '#94a3b8'}
                    />
                    {pt.loans > 0 && (
                      <rect
                        x={xCenter - barW / 2 + barW * 0.25}
                        y={loanY}
                        width={Math.max(4, barW * 0.5)}
                        height={Math.max(2, loanH)}
                        rx={2}
                        fill="#0f172a"
                      />
                    )}
                    {showLabel && (
                      <text
                        x={xCenter}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className={`text-[10px] font-mono ${
                          isToday ? 'fill-blue-700 font-semibold' : 'fill-slate-400'
                        }`}
                      >
                        {isToday ? 'Hari Ini' : pt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-blue-700 inline-block" />
                <span>Pengunjung Hari Ini</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" />
                <span>Pengunjung Harian</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-slate-900 inline-block" />
                <span>Transaksi Pinjam</span>
              </span>
            </div>
            <div className="font-mono tabular-nums text-slate-700">
              {hoveredIdx !== null && visibleSeries[hoveredIdx]
                ? `${visibleSeries[hoveredIdx].label}: ${visibleSeries[hoveredIdx].visitors} pengunjung · ${visibleSeries[hoveredIdx].loans} pinjam · ${visibleSeries[hoveredIdx].returns} kembali`
                : `Total ${rangeDays} hari: ${formatNumber(
                    visibleSeries.reduce((s, d) => s + d.visitors, 0),
                  )} kunjungan`}
            </div>
          </div>
        </section>

        {/* Today's Hourly & Purpose Distribution */}
        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Keperluan & Jam Kunjungan
              </h2>
              <button
                type="button"
                onClick={onOpenVisitorModal}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap cursor-pointer"
              >
                + Check-in
              </button>
            </div>

            <div className="space-y-3">
              {analytics.purposeBreakdown.map((item) => (
                <div key={item.purpose} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{item.purpose}</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-700 mb-3">
              Distribusi Jam Masuk Hari Ini (08:00–17:00)
            </div>
            <div className="grid grid-cols-10 gap-1.5 items-end h-20">
              {analytics.hourlyToday.map((slot) => {
                const heightPct = Math.max(8, Math.round((slot.visitors / maxHourlyVisitor) * 100));
                return (
                  <div
                    key={slot.hour}
                    className="flex flex-col items-center justify-end h-full gap-1"
                    title={`${slot.label}: ${slot.visitors} pengunjung`}
                  >
                    <div className="w-full bg-slate-100 rounded-xs flex items-end h-14 overflow-hidden">
                      <div
                        className={`w-full rounded-xs ${
                          slot.visitors > 0 ? 'bg-slate-800' : 'bg-slate-200'
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

      {/* Lower Grid: 2 Librarians Activity + Overdue Alerts + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2 Librarians Comparison & Today's Visitor Feed */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Aktivitas 2 Pustakawan
            </h2>
            <span className="text-xs text-slate-500">Rekap tugas petugas</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics.librarianStats.map((stat) => (
              <div key={stat.librarianId} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{stat.name}</div>
                    <div className="text-xs text-slate-500">{stat.role}</div>
                  </div>
                  <div className="text-right font-mono text-xs tabular-nums text-slate-700">
                    {stat.loansProcessed + stat.returnsProcessed} sirkulasi
                  </div>
                </div>
                <div className="mt-2.5 grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-md px-2.5 py-1.5">
                    <div className="text-slate-500 text-[11px]">Pinjam</div>
                    <div className="font-mono font-semibold tabular-nums text-slate-900">
                      {stat.loansProcessed}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-md px-2.5 py-1.5">
                    <div className="text-slate-500 text-[11px]">Kembali</div>
                    <div className="font-mono font-semibold tabular-nums text-slate-900">
                      {stat.returnsProcessed}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-md px-2.5 py-1.5">
                    <div className="text-slate-500 text-[11px]">Pengunjung</div>
                    <div className="font-mono font-semibold tabular-nums text-slate-900">
                      {stat.visitorsLogged}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-md px-2.5 py-1.5">
                    <div className="text-slate-500 text-[11px]">Notifikasi</div>
                    <div className="font-mono font-semibold tabular-nums text-slate-900">
                      {stat.notificationsSent}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-medium text-slate-700">Pengunjung Terbaru Hari Ini</span>
              <button
                type="button"
                onClick={() => onNavigate('visitors')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {todayVisitors.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada pengunjung tercatat hari ini.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayVisitors.slice(0, 4).map((v) => (
                  <div key={v.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900 truncate block">
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

        {/* Actionable Overdue Notifications & Low Stock */}
        <section className="lg:col-span-7 grid grid-cols-1 gap-6">
          {/* Overdue alerts */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-red-600" />
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Peringatan Denda Keterlambatan
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('notifications')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Kelola Notifikasi</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {overdueLoans.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
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
                      <tr key={loan.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-slate-900">{loan.borrowerName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{loan.code}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">
                          {loan.items.map((i) => i.title).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-red-600">
                          {loan.currentLateDays} hr
                        </td>
                        <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-semibold text-red-600">
                          {formatRupiah(loan.currentLateFine)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low Stock Watch */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <BookCopy className="w-4 h-4 text-amber-600" />
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Pelacakan Stok Menipis & Habis
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Katalog</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {lowStockBooks.length === 0 ? (
              <div className="py-5 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
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
                      <div className="font-medium text-slate-900 truncate">{book.title}</div>
                      <div className="text-slate-500">
                        {book.shelfCode} <span aria-hidden="true">·</span> {book.author}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          book.availableStock === 0 ? 'text-red-600' : 'text-amber-600'
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
    </div>
  );
}
