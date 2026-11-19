import React, { useState } from 'react';
import { BookOpen, KeyRound, ShieldCheck } from 'lucide-react';
import type { LibrarianId, LibrarianPublic } from '../types/library';

interface LibrarianLoginViewProps {
  librarians: LibrarianPublic[];
  onLogin: (librarianId: LibrarianId, pin: string) => Promise<void>;
  errorMessage: string | null;
}

export function LibrarianLoginView({
  librarians,
  onLogin,
  errorMessage,
}: LibrarianLoginViewProps) {
  const [selectedId, setSelectedId] = useState<LibrarianId>(librarians[0]?.id || 'lib-1');
  const [pin, setPin] = useState('123456');
  const [submitting, setSubmitting] = useState(false);

  const selectedLibrarian = librarians.find((l) => l.id === selectedId) || librarians[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibrarian) return;
    setSubmitting(true);
    try {
      await onLogin(selectedLibrarian.id, pin);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Left editorial panel */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">PustakaNusa</span>
            </div>
            <h1 className="mt-8 font-display text-2xl font-bold leading-tight text-white [text-wrap:balance]">
              Portal Sirkulasi & Analitik Perpustakaan
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Kelola peminjaman digital tarif Rp 1.000 per buku, pantau ketersediaan stok secara otomatis, kirim notifikasi denda keterlambatan, dan rekam kunjungan harian.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tarif Peminjaman</span>
              <span className="font-mono tabular-nums text-white">Rp 1.000 / buku</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Denda Keterlambatan</span>
              <span className="font-mono tabular-nums text-white">Rp 1.000 / hari / buku</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Akses Petugas Aktif</span>
              <span className="font-mono tabular-nums text-white">2 Akun Pustakawan</span>
            </div>
          </div>
        </div>

        {/* Right sign-in panel */}
        <div className="lg:col-span-7 p-8 sm:p-10">
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Masuk sebagai Pustakawan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih profil petugas yang bertugas untuk mencatat transaksi atas nama akun Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Pilih Akun Pustakawan (2 Petugas Terdaftar)
              </label>
              <div className="grid grid-cols-1 gap-3">
                {librarians.map((lib) => {
                  const isSelected = lib.id === selectedId;
                  return (
                    <button
                      key={lib.id}
                      type="button"
                      onClick={() => setSelectedId(lib.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-display text-sm font-semibold shrink-0 ${
                            isSelected
                              ? 'bg-blue-700 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lib.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {lib.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {lib.role} <span aria-hidden="true">·</span> {lib.shift}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          isSelected ? 'text-blue-700' : 'text-slate-400'
                        }`}
                      >
                        {isSelected ? 'Dipilih' : 'Pilih'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="librarian-pin" className="block text-xs font-medium text-slate-700">
                  PIN Akses Pustakawan
                </label>
                <span className="text-xs font-mono text-slate-500">PIN Default: 123456</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="librarian-pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan 6 digit PIN"
                  maxLength={12}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedLibrarian}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Memverifikasi Sesi...'
                  : `Masuk sebagai ${selectedLibrarian?.name.split(',')[0] || 'Pustakawan'}`}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
