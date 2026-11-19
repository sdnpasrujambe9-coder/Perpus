import React, { useMemo, useState } from 'react';
import { Minus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Book } from '../types/library';
import { BookSpineThumbnail } from './BookSpineThumbnail';

interface CatalogViewProps {
  books: Book[];
  onCreateBook: (payload: {
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    year: number;
    category: string;
    shelfCode: string;
    totalStock: number;
  }) => Promise<void>;
  onUpdateBook: (
    bookId: string,
    payload: Partial<{
      isbn: string;
      title: string;
      author: string;
      publisher: string;
      year: number;
      category: string;
      shelfCode: string;
      totalStock: number;
    }>,
  ) => Promise<void>;
  onDeleteBook: (bookId: string) => Promise<void>;
}

const BOOK_CATEGORIES = [
  'Sastra & Fiksi',
  'Teknologi & Komputer',
  'Sains & Matematika',
  'Sejarah & Budaya',
  'Ekonomi & Bisnis',
  'Pengembangan Diri',
  'Pendidikan',
];

export function CatalogView({
  books,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
}: CatalogViewProps) {
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low' | 'empty'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalBook, setModalBook] = useState<Book | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    year: new Date().getFullYear(),
    category: BOOK_CATEGORIES[0],
    shelfCode: 'RAK-A1',
    totalStock: 5,
  });

  const openNewModal = () => {
    setFormError(null);
    setForm({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      year: new Date().getFullYear(),
      category: BOOK_CATEGORIES[0],
      shelfCode: 'RAK-A1',
      totalStock: 5,
    });
    setModalBook('new');
  };

  const openEditModal = (book: Book) => {
    setFormError(null);
    setForm({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      year: book.year,
      category: book.category,
      shelfCode: book.shelfCode,
      totalStock: book.totalStock,
    });
    setModalBook(book);
  };

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      if (stockFilter === 'available' && b.availableStock === 0) return false;
      if (stockFilter === 'low' && !(b.availableStock > 0 && b.availableStock <= 2)) return false;
      if (stockFilter === 'empty' && b.availableStock !== 0) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.shelfCode.toLowerCase().includes(q)
      );
    });
  }, [books, query, stockFilter, categoryFilter]);

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (modalBook === 'new') {
        await onCreateBook({
          ...form,
          year: Number(form.year),
          totalStock: Number(form.totalStock),
        });
      } else if (modalBook) {
        await onUpdateBook(modalBook.id, {
          ...form,
          year: Number(form.year),
          totalStock: Number(form.totalStock),
        });
      }
      setModalBook(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data buku.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Toolbar */}
      <div className="bg-white border border-[#DCE3DF] rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#EEF2F0] rounded-lg">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'available', label: 'Tersedia' },
                { id: 'low', label: 'Menipis (≤ 2)' },
                { id: 'empty', label: 'Habis (0)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStockFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  stockFilter === tab.id
                    ? 'bg-white text-[#111C19] shadow-xs'
                    : 'text-slate-600 hover:text-[#111C19]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter kategori buku"
            className="px-3 py-2 text-xs bg-white border border-[#DCE3DF] rounded-lg text-slate-700 focus:outline-none focus:border-teal-700"
          >
            <option value="all">Semua Kategori</option>
            {BOOK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul, penulis, ISBN, rak..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAF9] border border-[#DCE3DF] rounded-lg text-[#111C19] focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </div>
          <button
            type="button"
            onClick={openNewModal}
            className="px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            + Tambah Buku
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-[#DCE3DF] rounded-2xl overflow-hidden">
        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-[#111C19]">Tidak ada buku ditemukan</p>
            <p className="mt-1 text-xs text-slate-500">
              Coba ubah kata kunci pencarian atau tambahkan judul buku baru ke katalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E7E4] bg-[#F8FAF9] text-slate-500">
                  <th className="py-3 px-4 font-medium">Koleksi Buku</th>
                  <th className="py-3 px-4 font-medium">Rak / ISBN</th>
                  <th className="py-3 px-4 font-medium">Kategori</th>
                  <th className="py-3 px-4 font-medium text-right">Total Stok</th>
                  <th className="py-3 px-4 font-medium text-right">Dipinjam</th>
                  <th className="py-3 px-4 font-medium text-right">Tersedia</th>
                  <th className="py-3 px-4 font-medium">Status Stok</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => {
                  const statusLabel =
                    book.availableStock === 0
                      ? 'Stok Habis'
                      : book.availableStock <= 2
                        ? 'Stok Menipis'
                        : 'Tersedia';
                  const statusTone =
                    book.availableStock === 0
                      ? 'text-red-600'
                      : book.availableStock <= 2
                        ? 'text-amber-700'
                        : 'text-emerald-700';

                  return (
                    <tr key={book.id} className="hover:bg-[#F8FAF9] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <BookSpineThumbnail
                            title={book.title}
                            category={book.category}
                            shelfCode={book.shelfCode}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-[#111C19]">{book.title}</div>
                            <div className="text-slate-500 mt-0.5">
                              {book.author} <span aria-hidden="true">·</span> {book.publisher} (
                              {book.year})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#111C19]">
                          {book.shelfCode}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">{book.isbn}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {book.category}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateBook(book.id, {
                                totalStock: Math.max(book.borrowedCount, book.totalStock - 1),
                              })
                            }
                            disabled={book.totalStock <= book.borrowedCount}
                            title="Kurangi 1 total stok"
                            aria-label={`Kurangi stok ${book.title}`}
                            className="p-1 rounded border border-[#DCE3DF] text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono tabular-nums font-medium text-[#111C19] w-6 text-center">
                            {book.totalStock}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateBook(book.id, { totalStock: book.totalStock + 1 })
                            }
                            title="Tambah 1 total stok"
                            aria-label={`Tambah stok ${book.title}`}
                            className="p-1 rounded border border-[#DCE3DF] text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        {book.borrowedCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#111C19]">
                        {book.availableStock}
                      </td>
                      <td className={`py-3.5 px-4 font-semibold whitespace-nowrap ${statusTone}`}>
                        {statusLabel}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(book)}
                            aria-label={`Edit buku ${book.title}`}
                            className="p-1.5 rounded-md text-slate-500 hover:text-[#111C19] hover:bg-slate-100 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBook(book.id)}
                            disabled={book.borrowedCount > 0}
                            title={
                              book.borrowedCount > 0
                                ? 'Tidak dapat dihapus selagi masih dipinjam'
                                : 'Hapus buku'
                            }
                            aria-label={`Hapus buku ${book.title}`}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add / Edit Book Modal */}
      {modalBook && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DCE3DF] rounded-2xl w-full max-w-lg p-6">
            <h3 className="font-display text-xl font-semibold text-[#111C19]">
              {modalBook === 'new' ? 'Tambah Judul Buku Baru' : 'Perbarui Data Buku'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Stok tersedia dihitung otomatis berdasarkan total stok dikurangi buku yang sedang dipinjam.
            </p>

            <form onSubmit={handleSaveBook} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Judul Buku</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Penulis</label>
                  <input
                    type="text"
                    required
                    value={form.author}
                    onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={form.publisher}
                    onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700 bg-white"
                  >
                    {BOOK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={form.isbn}
                    onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                    placeholder="Otomatis jika kosong"
                    className="w-full px-3 py-2 font-mono border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kode Rak</label>
                  <input
                    type="text"
                    required
                    value={form.shelfCode}
                    onChange={(e) => setForm((f) => ({ ...f, shelfCode: e.target.value }))}
                    className="w-full px-3 py-2 font-mono uppercase border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    min={1900}
                    max={2030}
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full px-3 py-2 font-mono border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total Eksemplar</label>
                  <input
                    type="number"
                    min={modalBook !== 'new' ? modalBook.borrowedCount : 1}
                    max={500}
                    required
                    value={form.totalStock}
                    onChange={(e) => setForm((f) => ({ ...f, totalStock: Number(e.target.value) }))}
                    className="w-full px-3 py-2 font-mono border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBook(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-[#DCE3DF] rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Buku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
