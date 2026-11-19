import React, { useMemo, useState } from 'react';
import { BellRing, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import type { EnrichedLoan } from '../types/library';
import { formatDateShort, formatRupiah, getDueStatusText } from '../lib/format';

interface CirculationViewProps {
  loans: EnrichedLoan[];
  onReturnLoan: (loanId: string, settleFine: boolean) => Promise<void>;
  onSettleFine: (loanId: string) => Promise<void>;
  onOpenLoanModal: () => void;
  onJumpToNotification: (loanId: string) => void;
}

type LoanFilter = 'all' | 'active' | 'overdue' | 'returned';

export function CirculationView({
  loans,
  onReturnLoan,
  onSettleFine,
  onOpenLoanModal,
  onJumpToNotification,
}: CirculationViewProps) {
  const [filter, setFilter] = useState<LoanFilter>('all');
  const [query, setQuery] = useState('');
  const [returningLoan, setReturningLoan] = useState<EnrichedLoan | null>(null);
  const [settleFineOnReturn, setSettleFineOnReturn] = useState(true);
  const [processing, setProcessing] = useState(false);

  const filteredLoans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loans.filter((loan) => {
      if (filter === 'active' && loan.status !== 'active') return false;
      if (filter === 'overdue' && !(loan.status === 'active' && loan.isOverdue)) return false;
      if (filter === 'returned' && loan.status !== 'returned') return false;
      if (!q) return true;
      return (
        loan.code.toLowerCase().includes(q) ||
        loan.borrowerName.toLowerCase().includes(q) ||
        loan.borrowerIdNumber.toLowerCase().includes(q) ||
        loan.items.some((i) => i.title.toLowerCase().includes(q))
      );
    });
  }, [loans, filter, query]);

  const counts = useMemo(() => {
    const active = loans.filter((l) => l.status === 'active').length;
    const overdue = loans.filter((l) => l.status === 'active' && l.isOverdue).length;
    const returned = loans.filter((l) => l.status === 'returned').length;
    return { all: loans.length, active, overdue, returned };
  }, [loans]);

  const handleConfirmReturn = async () => {
    if (!returningLoan) return;
    setProcessing(true);
    try {
      await onReturnLoan(returningLoan.id, settleFineOnReturn);
      setReturningLoan(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          {(
            [
              { id: 'all', label: `Semua (${counts.all})` },
              { id: 'active', label: `Dipinjam (${counts.active})` },
              { id: 'overdue', label: `Terlambat (${counts.overdue})` },
              { id: 'returned', label: `Dikembalikan (${counts.returned})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode, peminjam, atau judul buku..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
          <button
            type="button"
            onClick={onOpenLoanModal}
            className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            + Pinjam Buku
          </button>
        </div>
      </div>

      {/* Circulation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              Tidak ada transaksi peminjaman yang cocok
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ubah filter pencarian atau catat transaksi peminjaman buku baru.
            </p>
            <button
              type="button"
              onClick={onOpenLoanModal}
              className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-lg cursor-pointer"
            >
              Catat Peminjaman Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                  <th className="py-3 px-4 font-medium">Kode & Tanggal</th>
                  <th className="py-3 px-4 font-medium">Peminjam</th>
                  <th className="py-3 px-4 font-medium">Buku Dipinjam</th>
                  <th className="py-3 px-4 font-medium text-right">Biaya Sewa</th>
                  <th className="py-3 px-4 font-medium">Status & Jatuh Tempo</th>
                  <th className="py-3 px-4 font-medium text-right">Denda</th>
                  <th className="py-3 px-4 font-medium">Pustakawan</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map((loan) => {
                  const statusColor =
                    loan.status === 'returned'
                      ? 'text-emerald-700'
                      : loan.isOverdue
                        ? 'text-red-600'
                        : loan.isDueSoon
                          ? 'text-amber-700'
                          : 'text-blue-700';
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900">{loan.code}</div>
                        <div className="text-slate-500 mt-0.5">{formatDateShort(loan.borrowedAt)}</div>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-medium text-slate-900">{loan.borrowerName}</div>
                        <div className="text-slate-500 mt-0.5 font-mono text-[11px]">
                          {loan.borrowerIdNumber} <span aria-hidden="true">·</span> {loan.borrowerPhone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top max-w-[260px]">
                        <div className="text-slate-900 font-medium">
                          {loan.items.map((item) => item.title).join(', ')}
                        </div>
                        <div className="text-slate-500 mt-0.5 font-mono text-[11px]">
                          {loan.totalBooks} buku × Rp 1.000
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                        {formatRupiah(loan.loanFee)}
                      </td>
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className={`font-medium ${statusColor}`}>{getDueStatusText(loan)}</div>
                        <div className="text-slate-500 mt-0.5">
                          Batas: {formatDateShort(loan.dueDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        {loan.currentLateFine > 0 ? (
                          <div>
                            <div
                              className={`font-mono tabular-nums font-semibold ${
                                loan.fineSettled ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {formatRupiah(loan.currentLateFine)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {loan.fineSettled ? 'Lunas' : 'Belum lunas'}
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono tabular-nums text-slate-400">Rp 0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-700">{loan.processedByName.split(',')[0]}</div>
                        {loan.returnedByName && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Kembali: {loan.returnedByName.split(',')[0]}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {loan.status === 'active' ? (
                            <>
                              {(loan.isOverdue || loan.isDueSoon) && (
                                <button
                                  type="button"
                                  onClick={() => onJumpToNotification(loan.id)}
                                  title="Kirim notifikasi keterlambatan"
                                  className="px-2.5 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50 font-medium inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <BellRing className="w-3.5 h-3.5" />
                                  <span>Notifikasi</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setReturningLoan(loan);
                                  setSettleFineOnReturn(true);
                                }}
                                className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Kembalikan</span>
                              </button>
                            </>
                          ) : loan.lateFine > 0 && !loan.fineSettled ? (
                            <button
                              type="button"
                              onClick={() => onSettleFine(loan.id)}
                              className="px-3 py-1.5 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Lunasi Denda</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">Selesai</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Book Confirmation Modal */}
      {returningLoan && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-5">
            <div>
              <h3 id="return-modal-title" className="font-display text-lg font-semibold text-slate-900">
                Konfirmasi Pengembalian Buku
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Stok buku akan bertambah otomatis di katalog setelah pengembalian dikonfirmasi.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Peminjaman</span>
                <span className="font-mono font-semibold text-slate-900">{returningLoan.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peminjam</span>
                <span className="font-medium text-slate-900">{returningLoan.borrowerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buku Dikembalikan</span>
                <span className="font-medium text-slate-900 text-right max-w-[260px]">
                  {returningLoan.items.map((i) => i.title).join(', ')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Status Jatuh Tempo</span>
                <span
                  className={`font-medium ${
                    returningLoan.currentLateDays > 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {getDueStatusText(returningLoan)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Denda Keterlambatan</span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    returningLoan.currentLateFine > 0 ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {formatRupiah(returningLoan.currentLateFine)}
                </span>
              </div>
            </div>

            {returningLoan.currentLateFine > 0 && (
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settleFineOnReturn}
                  onChange={(e) => setSettleFineOnReturn(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span className="text-xs text-slate-700">
                  <strong className="font-semibold text-slate-900 block">
                    Tandai denda {formatRupiah(returningLoan.currentLateFine)} sudah dibayar lunas
                  </strong>
                  Hapus centang jika peminjam belum membayar denda saat buku dikembalikan.
                </span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                disabled={processing}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={processing}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {processing ? 'Memproses...' : 'Konfirmasi Pengembalian'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
