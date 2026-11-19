import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { VisitorCategory, VisitorPurpose } from '../types/library';

interface VisitorModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    visitorName: string;
    memberId: string;
    category: VisitorCategory;
    purpose: VisitorPurpose;
  }) => Promise<void>;
}

export function VisitorModal({ open, onClose, onSubmit }: VisitorModalProps) {
  const [visitorName, setVisitorName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [category, setCategory] = useState<VisitorCategory>('Mahasiswa');
  const [purpose, setPurpose] = useState<VisitorPurpose>('Baca di Tempat');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ visitorName, memberId, category, purpose });
      setVisitorName('');
      setMemberId('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat kunjungan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visitor-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 id="visitor-modal-title" className="font-display text-lg font-semibold text-slate-900">
              Catat Kunjungan Harian
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data langsung memperbarui dashboard analitik pengunjung hari ini.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal pengunjung"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Nama Pengunjung *</label>
            <input
              type="text"
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Contoh: Bagas Saputra"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              ID Anggota / Kartu Pelajar (Opsional)
            </label>
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="Contoh: ANG-2026-015"
              className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VisitorCategory)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="Pelajar">Pelajar</option>
                <option value="Mahasiswa">Mahasiswa</option>
                <option value="Umum">Umum</option>
                <option value="Peneliti">Peneliti</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Keperluan</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as VisitorPurpose)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="Baca di Tempat">Baca di Tempat</option>
                <option value="Peminjaman Buku">Peminjaman Buku</option>
                <option value="Pengembalian Buku">Pengembalian Buku</option>
                <option value="Riset & Referensi">Riset & Referensi</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Catat Kunjungan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
