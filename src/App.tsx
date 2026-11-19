import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { api, getStoredToken, setStoredToken } from './lib/api';
import type {
  BootstrapPayload,
  LibrarianId,
  LibrarianPublic,
  NotificationChannel,
  VisitorCategory,
  VisitorPurpose,
} from './types/library';
import { LibrarianLoginView } from './components/LibrarianLoginView';
import { Sidebar, type NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardAnalyticsView } from './components/DashboardAnalyticsView';
import { CirculationView } from './components/CirculationView';
import { CatalogView } from './components/CatalogView';
import { VisitorsView } from './components/VisitorsView';
import { NotificationsView } from './components/NotificationsView';
import { LoanModal } from './components/LoanModal';
import { VisitorModal } from './components/VisitorModal';
import { formatRupiah } from './lib/format';

export default function App() {
  const [librarians, setLibrarians] = useState<LibrarianPublic[]>([]);
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('analytics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [focusedNotifLoanId, setFocusedNotifLoanId] = useState<string | null>(null);
  const [switchTarget, setSwitchTarget] = useState<LibrarianPublic | null>(null);
  const [switchPin, setSwitchPin] = useState('123456');
  const [switchError, setSwitchError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dismissedOverdueBanner, setDismissedOverdueBanner] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadWorkspace = useCallback(async () => {
    const token = getStoredToken();
    try {
      const { librarians: libList } = await api.getLibrarians();
      setLibrarians(libList);
      if (!token) {
        setBootstrap(null);
        return;
      }
      const data = await api.getBootstrap();
      setBootstrap(data);
    } catch {
      setStoredToken(null);
      setBootstrap(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const refreshData = useCallback(async () => {
    const data = await api.getBootstrap();
    setBootstrap(data);
  }, []);

  const handleLogin = async (librarianId: LibrarianId, pin: string) => {
    setAuthError(null);
    try {
      const { token } = await api.login(librarianId, pin);
      setStoredToken(token);
      const data = await api.getBootstrap();
      setBootstrap(data);
      setDismissedOverdueBanner(false);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Gagal masuk sebagai pustakawan.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout network error
    }
    setStoredToken(null);
    setBootstrap(null);
    setActiveTab('analytics');
  };

  const handleConfirmSwitchLibrarian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchTarget) return;
    setSwitchError(null);
    try {
      const { token } = await api.login(switchTarget.id, switchPin);
      setStoredToken(token);
      await refreshData();
      showToast('success', `Sesi aktif beralih ke ${switchTarget.name}.`);
      setSwitchTarget(null);
      setSwitchPin('123456');
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'PIN tidak valid.');
    }
  };

  const handleCreateLoan = async (payload: {
    borrowerName: string;
    borrowerIdNumber: string;
    borrowerPhone: string;
    bookIds: string[];
    durationDays: number;
    notes?: string;
    autoLogVisitor?: boolean;
    visitorCategory?: VisitorCategory;
  }) => {
    const { loan } = await api.createLoan(payload);
    await refreshData();
    showToast(
      'success',
      `Peminjaman ${loan.code} (${loan.totalBooks} buku · ${formatRupiah(loan.loanFee)}) berhasil dicatat dan stok diperbarui.`,
    );
  };

  const handleReturnLoan = async (loanId: string, settleFine: boolean) => {
    try {
      const { loan } = await api.returnLoan(loanId, { settleFine });
      await refreshData();
      showToast(
        'success',
        `Pengembalian ${loan.code} selesai. ${loan.totalBooks} buku telah dikembalikan ke stok katalog.`,
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memproses pengembalian.');
    }
  };

  const handleSettleFine = async (loanId: string) => {
    try {
      const { loan } = await api.settleLoanFine(loanId);
      await refreshData();
      showToast('success', `Denda transaksi ${loan.code} ditandai lunas.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal melunasi denda.');
    }
  };

  const handleCreateBook = async (payload: {
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    year: number;
    category: string;
    shelfCode: string;
    totalStock: number;
  }) => {
    const { book } = await api.createBook(payload);
    await refreshData();
    showToast('success', `Buku "${book.title}" ditambahkan ke katalog (Stok: ${book.totalStock}).`);
  };

  const handleUpdateBook = async (
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
  ) => {
    try {
      const { book } = await api.updateBook(bookId, payload);
      await refreshData();
      showToast('success', `Stok & data "${book.title}" diperbarui (Tersedia: ${book.availableStock}).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui buku.';
      showToast('error', message);
      throw err;
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await api.deleteBook(bookId);
      await refreshData();
      showToast('success', 'Judul buku dihapus dari katalog.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus buku.');
    }
  };

  const handleCreateVisitor = async (payload: {
    visitorName: string;
    memberId: string;
    category: VisitorCategory;
    purpose: VisitorPurpose;
  }) => {
    const { visitor } = await api.createVisitor(payload);
    await refreshData();
    showToast('success', `Kunjungan ${visitor.visitorName} tercatat pada dashboard hari ini.`);
  };

  const handleSendNotification = async (payload: {
    loanId: string;
    channel: NotificationChannel;
    message: string;
  }) => {
    try {
      await api.sendNotification(payload);
      await refreshData();
      showToast('success', `Notifikasi keterlambatan (${payload.channel}) berhasil dicatat.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal mengirim notifikasi.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <LibrarianLoginView
        librarians={librarians}
        onLogin={handleLogin}
        errorMessage={authError}
      />
    );
  }

  const { analytics, books, loans, visitors, notificationLogs, currentLibrarian } = bootstrap;

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex text-[#111C19]">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentLibrarian={currentLibrarian}
        librarians={bootstrap.librarians}
        onSwitchLibrarian={(id) => {
          const target = bootstrap.librarians.find((l) => l.id === id) || null;
          setSwitchError(null);
          setSwitchPin('123456');
          setSwitchTarget(target);
        }}
        onLogout={handleLogout}
        overdueCount={analytics.overdueLoansCount}
        lowStockCount={analytics.lowStockBooksCount + analytics.outOfStockBooksCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeTab={activeTab}
          overdueCount={analytics.overdueLoansCount}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenLoanModal={() => setLoanModalOpen(true)}
          onOpenVisitorModal={() => setVisitorModalOpen(true)}
          onOpenNotifications={() => setActiveTab('notifications')}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-5">
          {/* Overdue Fine Alert Banner */}
          {!dismissedOverdueBanner &&
            analytics.overdueLoansCount > 0 &&
            activeTab !== 'notifications' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5 text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    Terdapat{' '}
                    <strong className="font-semibold tabular-nums">
                      {analytics.overdueLoansCount} transaksi keterlambatan
                    </strong>{' '}
                    dengan akumulasi denda berjalan{' '}
                    <strong className="font-mono tabular-nums">
                      {formatRupiah(analytics.pendingFinesTotal)}
                    </strong>
                    . Segera kirim pengingat pengembalian ke peminjam.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('notifications')}
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium whitespace-nowrap cursor-pointer"
                  >
                    Buka Notifikasi Denda
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedOverdueBanner(true)}
                    aria-label="Tutup peringatan denda"
                    className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          {activeTab === 'analytics' && (
            <DashboardAnalyticsView
              analytics={analytics}
              currentLibrarian={currentLibrarian}
              loans={loans}
              books={books}
              visitors={visitors}
              onNavigate={setActiveTab}
              onOpenVisitorModal={() => setVisitorModalOpen(true)}
              onOpenLoanModal={() => setLoanModalOpen(true)}
            />
          )}

          {activeTab === 'circulation' && (
            <CirculationView
              loans={loans}
              onReturnLoan={handleReturnLoan}
              onSettleFine={handleSettleFine}
              onOpenLoanModal={() => setLoanModalOpen(true)}
              onJumpToNotification={(loanId) => {
                setFocusedNotifLoanId(loanId);
                setActiveTab('notifications');
              }}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              books={books}
              onCreateBook={handleCreateBook}
              onUpdateBook={handleUpdateBook}
              onDeleteBook={handleDeleteBook}
            />
          )}

          {activeTab === 'visitors' && (
            <VisitorsView
              visitors={visitors}
              analytics={analytics}
              onOpenVisitorModal={() => setVisitorModalOpen(true)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              loans={loans}
              notificationLogs={notificationLogs}
              focusedLoanId={focusedNotifLoanId}
              onClearFocus={() => setFocusedNotifLoanId(null)}
              onSendNotification={handleSendNotification}
              onGoToReturn={() => setActiveTab('circulation')}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <LoanModal
        open={loanModalOpen}
        books={books}
        onClose={() => setLoanModalOpen(false)}
        onSubmit={handleCreateLoan}
      />

      <VisitorModal
        open={visitorModalOpen}
        onClose={() => setVisitorModalOpen(false)}
        onSubmit={handleCreateVisitor}
      />

      {/* Quick Switch Librarian PIN Modal */}
      {switchTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DCE3DF] rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-display text-lg font-semibold text-[#111C19]">
              Ganti Sesi Pustakawan
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Masuk sebagai <strong className="text-[#111C19]">{switchTarget.name}</strong> ({switchTarget.role}).
            </p>
            <form onSubmit={handleConfirmSwitchLibrarian} className="mt-4 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-700">PIN Pustakawan</label>
                  <span className="font-mono text-slate-400">Default: 123456</span>
                </div>
                <input
                  type="password"
                  required
                  value={switchPin}
                  onChange={(e) => setSwitchPin(e.target.value)}
                  className="w-full px-3 py-2 font-mono border border-[#DCE3DF] rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>
              {switchError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  {switchError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSwitchTarget(null)}
                  className="px-3.5 py-2 rounded-lg border border-[#DCE3DF] text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold cursor-pointer"
                >
                  Konfirmasi Beralih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-xl border shadow-sm flex items-start gap-2.5 text-xs ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-slate-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
