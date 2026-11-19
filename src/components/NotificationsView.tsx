import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Check, Copy, Send } from 'lucide-react';
import type { EnrichedLoan, NotificationChannel, NotificationLog } from '../types/library';
import {
  buildOverdueMessage,
  formatDateShort,
  formatDateTime,
  formatRupiah,
  getDueStatusText,
} from '../lib/format';

interface NotificationsViewProps {
  loans: EnrichedLoan[];
  notificationLogs: NotificationLog[];
  focusedLoanId: string | null;
  onClearFocus: () => void;
  onSendNotification: (payload: {
    loanId: string;
    channel: NotificationChannel;
    message: string;
  }) => Promise<void>;
  onGoToReturn: () => void;
}

export function NotificationsView({
  loans,
  notificationLogs,
  focusedLoanId,
  onClearFocus,
  onSendNotification,
  onGoToReturn,
}: NotificationsViewProps) {
  const alertLoans = useMemo(() => {
    return loans
      .filter((l) => l.status === 'active' && (l.isOverdue || l.isDueSoon))
      .sort((a, b) => b.currentLateDays - a.currentLateDays);
  }, [loans]);

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    focusedLoanId || alertLoans[0]?.id || null,
  );
  const [channel, setChannel] = useState<NotificationChannel>('WhatsApp');
  const [draftMessage, setDraftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (focusedLoanId) {
      setSelectedLoanId(focusedLoanId);
      onClearFocus();
    }
  }, [focusedLoanId, onClearFocus]);

  const selectedLoan = useMemo(
    () => alertLoans.find((l) => l.id === selectedLoanId) || alertLoans[0] || null,
    [alertLoans, selectedLoanId],
  );

  useEffect(() => {
    if (selectedLoan) {
      setDraftMessage(buildOverdueMessage(selectedLoan));
    } else {
      setDraftMessage('');
    }
  }, [selectedLoan]);

  const totalPendingFines = useMemo(
    () => alertLoans.reduce((sum, l) => sum + l.currentLateFine, 0),
    [alertLoans],
  );

  const handleCopyAndSend = async () => {
    if (!selectedLoan || !draftMessage.trim()) return;
    setSending(true);
    setFeedback(null);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(draftMessage).catch(() => {});
        setCopiedId(selectedLoan.id);
        setTimeout(() => setCopiedId(null), 2500);
      }
      await onSendNotification({
        loanId: selectedLoan.id,
        channel,
        message: draftMessage.trim(),
      });
      setFeedback(
        `Notifikasi ${channel} untuk ${selectedLoan.borrowerName} berhasil dicatat dan disalin ke clipboard.`,
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Peminjaman Terlambat & Jatuh Tempo</div>
          <div className="mt-2 font-mono text-2xl font-semibold text-red-600 tabular-nums">
            {alertLoans.length} transaksi
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Denda dihitung otomatis Rp 1.000 / hari / buku
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Total Akumulasi Denda Aktif</div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {formatRupiah(totalPendingFines)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Belum dikembalikan ke sirkulasi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">Notifikasi Terkirim</div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {notificationLogs.length} pesan
          </div>
          <div className="mt-1 text-xs text-slate-500">Riwayat pengingat dari 2 pustakawan</div>
        </div>
      </div>

      {/* Main Split: Left Overdue Queue + Right Message Composer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Daftar Peringatan Keterlambatan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih peminjam untuk menyiapkan dan mengirim notifikasi denda keterlambatan.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToReturn}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap cursor-pointer"
            >
              Ke Sirkulasi Pengembalian →
            </button>
          </div>

          {alertLoans.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Tidak ada peminjaman yang terlambat atau mendekati jatuh tempo hari ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alertLoans.map((loan) => {
                const isSelected = selectedLoan?.id === loan.id;
                return (
                  <button
                    key={loan.id}
                    type="button"
                    onClick={() => setSelectedLoanId(loan.id)}
                    className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-4 cursor-pointer ${
                      isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {loan.borrowerName}
                        </span>
                        <span className="font-mono text-xs text-slate-400">· {loan.code}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 truncate">
                        {loan.items.map((i) => i.title).join(', ')} ({loan.totalBooks} buku)
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        WA: <span className="font-mono">{loan.borrowerPhone}</span>{' '}
                        <span aria-hidden="true">·</span> Batas: {formatDateShort(loan.dueDate)}
                        {loan.notificationCount > 0 && (
                          <>
                            {' '}
                            <span aria-hidden="true">·</span>{' '}
                            <span className="text-slate-700 font-medium">
                              Terkirim {loan.notificationCount}×
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-semibold ${
                          loan.isOverdue ? 'text-red-600' : 'text-amber-700'
                        }`}
                      >
                        {getDueStatusText(loan)}
                      </div>
                      <div className="font-mono tabular-nums text-sm font-semibold text-slate-900 mt-0.5">
                        {formatRupiah(loan.currentLateFine)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Composer */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          {selectedLoan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-900">
                    Kirim Notifikasi Denda
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kepada {selectedLoan.borrowerName} ({selectedLoan.borrowerPhone})
                  </p>
                </div>
                <BellRing className="w-4 h-4 text-red-600 shrink-0" />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rincian Denda</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {selectedLoan.totalBooks} buku × {selectedLoan.currentLateDays} hari × Rp 1.000
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Total Denda Berjalan</span>
                  <span className="font-mono tabular-nums text-red-600">
                    {formatRupiah(selectedLoan.currentLateFine)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Kanal Pengiriman
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['WhatsApp', 'SMS', 'Sistem'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        channel === ch
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="notif-message"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Isi Pesan Pengingat
                </label>
                <textarea
                  id="notif-message"
                  rows={5}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  className="w-full p-3 text-xs leading-relaxed border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {feedback && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {feedback}
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(draftMessage).catch(() => {});
                      setCopiedId(selectedLoan.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }
                  }}
                  className="px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === selectedLoan.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pesan</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyAndSend}
                  disabled={sending || !draftMessage.trim()}
                  className="flex-1 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Mengirim...' : `Kirim & Catat Notifikasi ${channel}`}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Pilih peminjaman dari daftar di sebelah kiri untuk membuat pesan notifikasi.
            </div>
          )}
        </section>
      </div>

      {/* Sent Notification History */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Riwayat Notifikasi Terkirim
          </h2>
        </div>
        {notificationLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Belum ada riwayat notifikasi terkirim.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                  <th className="py-3 px-4 font-medium">Waktu Kirim</th>
                  <th className="py-3 px-4 font-medium">Peminjam / Kode</th>
                  <th className="py-3 px-4 font-medium">Kanal</th>
                  <th className="py-3 px-4 font-medium text-right">Denda Saat Dikirim</th>
                  <th className="py-3 px-4 font-medium">Ringkasan Pesan</th>
                  <th className="py-3 px-4 font-medium">Pustakawan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notificationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.sentAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{log.borrowerName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{log.loanCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{log.channel}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-red-600 whitespace-nowrap">
                      {formatRupiah(log.estimatedFine)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md truncate">{log.message}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {log.sentByName.split(',')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
