import React, { useMemo, useState } from 'react';
import { Minus, Plus, Search, X } from 'lucide-react';
import type { Book, VisitorCategory } from '../types/library';
import { LOAN_FEE_PER_BOOK, formatRupiah } from '../lib/format';

interface LoanModalProps {
  open: boolean;
  books: Book[];
  onClose: () => void;
  onSubmit: (payload: {
    borrowerName: string;
    borrowerIdNumber: string;
    borrowerPhone: string;
    bookIds: string[];
    durationDays: number;
    notes?: string;
    autoLogVisitor?: boolean;
    visitorCategory?: VisitorCategory;
  }) => Promise<void>;
}

export function LoanModal({ open, books, onClose, onSubmit }: LoanModalProps) {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerIdNumber, setBorrowerIdNumber] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [autoLogVisitor, setAutoLogVisitor] = useState(true);
  const [visitorCategory, setVisitorCategory] = useState<VisitorCategory>('Mahasiswa');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const id of selectedBookIds) {
      map.set(id, (map.get(id) || 0) + 1);
    }
    return map;
  }, [selectedBookIds]);

  const filteredBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    return books.filter((b) => {
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.shelfCode.toLowerCase().includes(q)
      );
    });
  }, [books, bookSearch]);

  if (!open) return null;

  const totalFee = selectedBookIds.length * LOAN_FEE_PER_BOOK;

  const addBook = (book: Book) => {
    const currentSelected = selectedCountMap.get(book.id) || 0;
    if (currentSelected >= book.availableStock) return;
    if (selectedBookIds.length >= 10) return;
    setSelectedBookIds((prev) => [...prev, book.id]);
  };

  const removeOneBook = (bookId: string) => {
    setSelectedBookIds((prev) => {
      const idx = prev.lastIndexOf(bookId);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selectedBookIds.length === 0) {
      setError('Pilih minimal 1 buku dari daftar katalog.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        borrowerName,
        borrowerIdNumber,
        borrowerPhone,
        bookIds: selectedBookIds,
        durationDays,
        notes,
        autoLogVisitor,
        visitorCategory,
      });
      setBorrowerName('');
      setBorrowerIdNumber('');
      setBorrowerPhone('');
      setSelectedBookIds([]);
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan peminjaman.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl overflow-hidden my-4">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="loan-modal-title" className="font-display text-lg font-semibold text-slate-900">
              Catat Peminjaman Buku Digital
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarif tetap Rp 1.000 per buku · Stok berkurang otomatis setelah disimpan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal peminjaman"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left: Borrower & Fee Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nama Peminjam *</label>
              <input
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="Contoh: Nadia Kusuma"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">ID Anggota / NIS</label>
                <input
                  type="text"
                  value={borrowerIdNumber}
                  onChange={(e) => setBorrowerIdNumber(e.target.value)}
                  placeholder="ANG-2026-..."
                  className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Kategori</label>
                <select
                  value={visitorCategory}
                  onChange={(e) => setVisitorCategory(e.target.value as VisitorCategory)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="Pelajar">Pelajar</option>
                  <option value="Mahasiswa">Mahasiswa</option>
                  <option value="Umum">Umum</option>
                  <option value="Peneliti">Peneliti</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                No. WhatsApp / Telepon * (untuk notifikasi denda)
              </label>
              <input
                type="tel"
                required
                value={borrowerPhone}
                onChange={(e) => setBorrowerPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Durasi Peminjaman</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[3, 7, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationDays(d)}
                    className={`py-2 rounded-lg border font-medium transition-colors cursor-pointer ${
                      durationDays === d
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {d} Hari
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Catatan (Opsional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan kondisi buku atau keperluan"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoLogVisitor}
                onChange={(e) => setAutoLogVisitor(e.target.checked)}
                className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Catat otomatis ke log pengunjung hari ini</span>
            </label>

            {/* Fee Calculation Box */}
            <div className="bg-slate-900 text-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Jumlah Buku Dipilih</span>
                <span className="font-mono tabular-nums">{selectedBookIds.length} buku</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tarif per Buku</span>
                <span className="font-mono tabular-nums">{formatRupiah(LOAN_FEE_PER_BOOK)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
                <span className="font-medium">Total Biaya Peminjaman</span>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {formatRupiah(totalFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Book Picker */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-slate-700">
                Pilih Buku dari Katalog (Pelacakan Stok Real-Time)
              </label>
              <span className="font-mono text-slate-500 tabular-nums">
                {selectedBookIds.length}/10 maks
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Cari judul buku, penulis, atau kode rak..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-80 overflow-y-auto flex-1">
              {filteredBooks.map((book) => {
                const count = selectedCountMap.get(book.id) || 0;
                const remaining = book.availableStock - count;
                return (
                  <div
                    key={book.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{book.title}</div>
                      <div className="text-slate-500 mt-0.5 truncate">
                        {book.author} <span aria-hidden="true">·</span> {book.shelfCode}{' '}
                        <span aria-hidden="true">·</span>{' '}
                        <span
                          className={`font-mono tabular-nums font-medium ${
                            remaining === 0 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          Stok sisa: {remaining}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {count > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => removeOneBook(book.id)}
                            aria-label={`Kurangi ${book.title}`}
                            className="p-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono tabular-nums font-semibold text-blue-700 w-5 text-center">
                            {count}
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => addBook(book)}
                        disabled={remaining <= 0 || selectedBookIds.length >= 10}
                        aria-label={`Pilih ${book.title}`}
                        className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-35 text-white font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Pilih</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || selectedBookIds.length === 0}
                className="px-5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {submitting
                  ? 'Memproses...'
                  : `Simpan Peminjaman (${formatRupiah(totalFee)})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
