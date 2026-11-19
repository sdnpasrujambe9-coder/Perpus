import type { EnrichedLoan } from '../types/library';

export const LOAN_FEE_PER_BOOK = 1000;
export const LATE_FINE_PER_DAY_PER_BOOK = 1000;

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('id-ID').format(val);
}

export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDueStatusText(loan: EnrichedLoan): string {
  if (loan.status === 'returned') {
    return loan.lateDays > 0
      ? `Kembali (Terlambat ${loan.lateDays} hari)`
      : 'Dikembalikan tepat waktu';
  }
  if (loan.currentLateDays > 0) {
    return `Terlambat ${loan.currentLateDays} hari`;
  }
  const due = new Date(loan.dueDate);
  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Jatuh tempo hari ini';
  if (diffDays === 1) return 'Jatuh tempo besok';
  return `Sisa ${diffDays} hari`;
}

export function buildOverdueMessage(loan: EnrichedLoan): string {
  const bookTitles = loan.items.map((item) => `"${item.title}"`).join(', ');
  if (loan.currentLateDays > 0) {
    return (
      `Yth. ${loan.borrowerName}, ini pengingat dari Perpustakaan PustakaNusa. ` +
      `Peminjaman kode ${loan.code} (${bookTitles}) telah melewati batas pengembalian (${formatDateShort(loan.dueDate)}) ` +
      `selama ${loan.currentLateDays} hari. Akumulasi denda keterlambatan saat ini: ` +
      `${formatRupiah(loan.currentLateFine)} (${loan.totalBooks} buku × ${loan.currentLateDays} hari × Rp 1.000). ` +
      `Mohon segera mengembalikan buku ke meja sirkulasi. Terima kasih.`
    );
  }
  return (
    `Yth. ${loan.borrowerName}, pengingat ramah dari Perpustakaan PustakaNusa. ` +
    `Peminjaman kode ${loan.code} (${bookTitles}) akan jatuh tempo pada ${formatDateShort(loan.dueDate)}. ` +
    `Harap mengembalikan tepat waktu untuk menghindari denda keterlambatan Rp 1.000/hari per buku. Terima kasih.`
  );
}
