import React, { useState } from 'react';
import { ArrowRight, BookOpen, KeyRound, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
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
    <div className="min-h-screen bg-[#F4F6F5] flex flex-col justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-[#DCE3DF] rounded-2xl overflow-hidden shadow-xs"
      >
        {/* Left Deep Archival Panel */}
        <div className="lg:col-span-5 bg-[#0E1B18] text-slate-100 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle architectural bookshelf SVG motif */}
          <svg
            aria-hidden="true"
            viewBox="0 0 320 260"
            className="absolute -bottom-8 -right-8 w-64 h-52 opacity-15 pointer-events-none"
          >
            <rect x="20" y="60" width="24" height="160" rx="2" fill="#5EEAD4" />
            <rect x="50" y="35" width="30" height="185" rx="2" fill="#99F6E4" />
            <rect x="86" y="80" width="22" height="140" rx="2" fill="#2DD4BF" />
            <rect x="114" y="45" width="34" height="175" rx="2" fill="#CCFBF1" />
            <rect x="156" y="70" width="26" height="150" rx="2" fill="#5EEAD4" />
            <rect x="190" y="25" width="28" height="195" rx="2" fill="#14B8A6" />
            <rect x="226" y="65" width="32" height="155" rx="2" fill="#99F6E4" />
            <line x1="10" y1="224" x2="290" y2="224" stroke="#5EEAD4" strokeWidth="3" />
          </svg>

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">PustakaNusa</span>
            </div>

            <h1 className="mt-9 font-display text-3xl font-semibold leading-[1.18] text-white [text-wrap:balance]">
              Ruang Sirkulasi & Analitik Perpustakaan
            </h1>
            <p className="mt-3.5 text-sm leading-relaxed text-slate-300">
              Sistem terpadu untuk pencatatan peminjaman digital, pelacakan stok otomatis, notifikasi denda keterlambatan, dan pemantauan kunjungan harian.
            </p>
          </div>

          <div className="relative z-10 mt-10 pt-6 border-t border-[#1E322D] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tarif Peminjaman</span>
              <span className="font-mono tabular-nums text-teal-300 font-medium">
                Rp 1.000 / buku
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Denda Keterlambatan</span>
              <span className="font-mono tabular-nums text-slate-200 font-medium">
                Rp 1.000 / hari / buku
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Akses Pustakawan</span>
              <span className="font-mono tabular-nums text-slate-200 font-medium">
                2 Akun Petugas Terdaftar
              </span>
            </div>
          </div>
        </div>

        {/* Right Librarian Sign-in Panel */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-[#111C19]">
              Masuk Meja Pustakawan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih identitas pustakawan yang sedang bertugas hari ini.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700">
                Akun Pustakawan Aktif
              </label>
              <div className="grid grid-cols-1 gap-3">
                {librarians.map((lib) => {
                  const isSelected = lib.id === selectedId;
                  return (
                    <button
                      key={lib.id}
                      type="button"
                      onClick={() => setSelectedId(lib.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/60'
                          : 'border-[#E2E7E4] bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-display text-sm font-bold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-[#EEF2F0] text-[#111C19]'
                          }`}
                        >
                          {lib.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#111C19] truncate">
                            {lib.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {lib.role} <span aria-hidden="true">·</span> {lib.shift}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 flex items-center gap-1 ${
                          isSelected ? 'text-teal-800' : 'text-slate-400'
                        }`}
                      >
                        {isSelected ? 'Aktif Dipilih' : 'Pilih'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="librarian-pin"
                  className="block text-xs font-semibold text-slate-700"
                >
                  PIN Akses Petugas
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-mono bg-white border border-[#DCE3DF] rounded-xl text-[#111C19] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-medium text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedLibrarian}
              className="w-full py-3 px-4 bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Memverifikasi Sesi...'
                  : `Masuk sebagai ${selectedLibrarian?.name.split(',')[0] || 'Pustakawan'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
