export type LibrarianId = 'lib-1' | 'lib-2';

export interface LibrarianPublic {
  id: LibrarianId;
  name: string;
  role: string;
  email: string;
  initials: string;
  shift: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: string;
  shelfCode: string;
  totalStock: number;
  borrowedCount: number;
  availableStock: number;
  createdAt: string;
  updatedAt: string;
}

export type LoanStatus = 'active' | 'returned';

export interface LoanItem {
  bookId: string;
  title: string;
  author: string;
  shelfCode: string;
  feePerBook: number;
}

export interface Loan {
  id: string;
  code: string;
  borrowerName: string;
  borrowerIdNumber: string;
  borrowerPhone: string;
  items: LoanItem[];
  totalBooks: number;
  loanFee: number;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  lateDays: number;
  lateFine: number;
  fineSettled: boolean;
  status: LoanStatus;
  processedById: LibrarianId;
  processedByName: string;
  returnedById: LibrarianId | null;
  returnedByName: string | null;
  lastNotifiedAt: string | null;
  notificationCount: number;
  notes?: string;
}

export interface EnrichedLoan extends Loan {
  currentLateDays: number;
  currentLateFine: number;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export type VisitorCategory = 'Pelajar' | 'Mahasiswa' | 'Umum' | 'Peneliti';
export type VisitorPurpose =
  | 'Baca di Tempat'
  | 'Peminjaman Buku'
  | 'Pengembalian Buku'
  | 'Riset & Referensi';

export interface VisitorLog {
  id: string;
  visitorName: string;
  memberId: string;
  category: VisitorCategory;
  purpose: VisitorPurpose;
  visitedAt: string;
  dateKey: string;
  hour: number;
  recordedById: LibrarianId;
  recordedByName: string;
}

export type NotificationChannel = 'WhatsApp' | 'SMS' | 'Sistem';

export interface NotificationLog {
  id: string;
  loanId: string;
  loanCode: string;
  borrowerName: string;
  borrowerPhone: string;
  type: 'overdue' | 'due_soon';
  lateDays: number;
  estimatedFine: number;
  message: string;
  sentAt: string;
  sentById: LibrarianId;
  sentByName: string;
  channel: NotificationChannel;
}

export interface DailySeriesPoint {
  dateKey: string;
  label: string;
  visitors: number;
  loans: number;
  returns: number;
}

export interface HourlySeriesPoint {
  hour: number;
  label: string;
  visitors: number;
}

export interface LibrarianActivityStat {
  librarianId: LibrarianId;
  name: string;
  role: string;
  loansProcessed: number;
  returnsProcessed: number;
  visitorsLogged: number;
  notificationsSent: number;
}

export interface DashboardAnalytics {
  todayDateKey: string;
  visitorsToday: number;
  visitorsYesterday: number;
  activeLoansCount: number;
  booksCurrentlyBorrowed: number;
  totalCatalogTitles: number;
  totalStockUnits: number;
  availableStockUnits: number;
  lowStockBooksCount: number;
  outOfStockBooksCount: number;
  totalLoanRevenue: number;
  todayLoanRevenue: number;
  totalCollectedFines: number;
  pendingFinesTotal: number;
  overdueLoansCount: number;
  dueSoonLoansCount: number;
  dailySeries: DailySeriesPoint[];
  hourlyToday: HourlySeriesPoint[];
  purposeBreakdown: Array<{ purpose: VisitorPurpose; count: number; percentage: number }>;
  categoryBreakdown: Array<{ category: VisitorCategory; count: number; percentage: number }>;
  librarianStats: LibrarianActivityStat[];
}

export interface BootstrapPayload {
  currentLibrarian: LibrarianPublic;
  librarians: LibrarianPublic[];
  books: Book[];
  loans: EnrichedLoan[];
  visitors: VisitorLog[];
  notificationLogs: NotificationLog[];
  analytics: DashboardAnalytics;
  constants: {
    loanFeePerBook: number;
    lateFinePerDayPerBook: number;
  };
}
