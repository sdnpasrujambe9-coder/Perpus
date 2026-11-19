import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import type {
  Book,
  DashboardAnalytics,
  EnrichedLoan,
  LibrarianId,
  LibrarianPublic,
  Loan,
  LoanItem,
  NotificationChannel,
  NotificationLog,
  VisitorCategory,
  VisitorLog,
  VisitorPurpose,
} from './src/types/library.ts';

const PORT = Number(process.env.PORT) || 3000;
const LOAN_FEE_PER_BOOK = 1000;
const LATE_FINE_PER_DAY_PER_BOOK = 1000;

interface LibrarianRecord extends LibrarianPublic {
  pin: string;
}

interface SessionRecord {
  token: string;
  librarianId: LibrarianId;
  createdAt: string;
}

interface LibraryDatabase {
  librarians: LibrarianRecord[];
  sessions: SessionRecord[];
  books: Book[];
  loans: Loan[];
  visitors: VisitorLog[];
  notificationLogs: NotificationLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'library-db.json');

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function setTimeOfDay(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function calculateLateDays(dueDateIso: string, referenceDate: Date): number {
  const due = new Date(dueDateIso);
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const diffMs = refMidnight.getTime() - dueMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

function calculateDaysUntilDue(dueDateIso: string, referenceDate: Date): number {
  const due = new Date(dueDateIso);
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  return Math.floor((dueMidnight.getTime() - refMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

function syncBookStocks(db: LibraryDatabase): void {
  const activeBorrowCounts = new Map<string, number>();
  for (const loan of db.loans) {
    if (loan.status === 'active') {
      for (const item of loan.items) {
        activeBorrowCounts.set(item.bookId, (activeBorrowCounts.get(item.bookId) || 0) + 1);
      }
    }
  }
  for (const book of db.books) {
    const borrowed = activeBorrowCounts.get(book.id) || 0;
    book.borrowedCount = borrowed;
    book.availableStock = Math.max(0, book.totalStock - borrowed);
  }
}

function createInitialDatabase(): LibraryDatabase {
  const now = new Date();
  const todayIso = now.toISOString();

  const librarians: LibrarianRecord[] = [
    {
      id: 'lib-1',
      name: 'Siti Aminah, S.Pust.',
      role: 'Kepala Sirkulasi',
      email: 'pustakawan1@pustakanusa.id',
      initials: 'SA',
      shift: 'Pagi (08:00 - 15:00)',
      pin: '123456',
    },
    {
      id: 'lib-2',
      name: 'Budi Santoso, A.Md.',
      role: 'Pustakawan Katalog & Layanan',
      email: 'pustakawan2@pustakanusa.id',
      initials: 'BS',
      shift: 'Siang (10:00 - 17:00)',
      pin: '123456',
    },
  ];

  const books: Book[] = [
    {
      id: 'bk-01',
      isbn: '978-979-3062-79-2',
      title: 'Laskar Pelangi',
      author: 'Andrea Hirata',
      publisher: 'Bentang Pustaka',
      year: 2005,
      category: 'Sastra & Fiksi',
      shelfCode: 'RAK-A1',
      totalStock: 6,
      borrowedCount: 0,
      availableStock: 6,
      createdAt: addDays(now, -45).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-02',
      isbn: '978-602-03-8591-6',
      title: 'Bumi Manusia',
      author: 'Pramoedya Ananta Toer',
      publisher: 'Lentera Dipantara',
      year: 2005,
      category: 'Sastra & Fiksi',
      shelfCode: 'RAK-A2',
      totalStock: 4,
      borrowedCount: 0,
      availableStock: 4,
      createdAt: addDays(now, -45).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-03',
      isbn: '978-623-00-1982-1',
      title: 'Algoritma & Struktur Data Modern',
      author: 'Rinaldi Munir',
      publisher: 'Informatika Bandung',
      year: 2023,
      category: 'Teknologi & Komputer',
      shelfCode: 'RAK-T1',
      totalStock: 5,
      borrowedCount: 0,
      availableStock: 5,
      createdAt: addDays(now, -40).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-04',
      isbn: '978-0-13-468599-1',
      title: 'Clean Code: Panduan Praktis',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      year: 2021,
      category: 'Teknologi & Komputer',
      shelfCode: 'RAK-T2',
      totalStock: 3,
      borrowedCount: 0,
      availableStock: 3,
      createdAt: addDays(now, -38).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-05',
      isbn: '978-602-424-694-5',
      title: 'Laut Bercerita',
      author: 'Leila S. Chudori',
      publisher: 'Kepustakaan Populer Gramedia',
      year: 2017,
      category: 'Sastra & Fiksi',
      shelfCode: 'RAK-A3',
      totalStock: 4,
      borrowedCount: 0,
      availableStock: 4,
      createdAt: addDays(now, -35).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-06',
      isbn: '978-602-06-3317-6',
      title: 'Atomic Habits (Edisi Indonesia)',
      author: 'James Clear',
      publisher: 'Gramedia Pustaka Utama',
      year: 2022,
      category: 'Pengembangan Diri',
      shelfCode: 'RAK-P1',
      totalStock: 5,
      borrowedCount: 0,
      availableStock: 5,
      createdAt: addDays(now, -30).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-07',
      isbn: '978-602-481-234-8',
      title: 'Sejarah Nusantara yang Disembunyikan',
      author: 'Fatimah Mernissi & Tim',
      publisher: 'Pustaka Alvabet',
      year: 2020,
      category: 'Sejarah & Budaya',
      shelfCode: 'RAK-S1',
      totalStock: 3,
      borrowedCount: 0,
      availableStock: 3,
      createdAt: addDays(now, -28).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-08',
      isbn: '978-602-291-789-2',
      title: 'Kosmos: Edisi Ilustrasi',
      author: 'Carl Sagan',
      publisher: 'Kepustakaan Populer Gramedia',
      year: 2021,
      category: 'Sains & Matematika',
      shelfCode: 'RAK-M1',
      totalStock: 2,
      borrowedCount: 0,
      availableStock: 2,
      createdAt: addDays(now, -25).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-09',
      isbn: '978-623-242-118-9',
      title: 'Filosofi Teras',
      author: 'Henry Manampiring',
      publisher: 'Kompas Penerbit Buku',
      year: 2019,
      category: 'Pengembangan Diri',
      shelfCode: 'RAK-P2',
      totalStock: 5,
      borrowedCount: 0,
      availableStock: 5,
      createdAt: addDays(now, -22).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-10',
      isbn: '978-602-04-9881-2',
      title: 'Psikologi Uang',
      author: 'Morgan Housel',
      publisher: 'Baca',
      year: 2022,
      category: 'Ekonomi & Bisnis',
      shelfCode: 'RAK-E1',
      totalStock: 4,
      borrowedCount: 0,
      availableStock: 4,
      createdAt: addDays(now, -20).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-11',
      isbn: '978-979-461-822-6',
      title: 'Kalkulus & Geometri Analitis Jilid 1',
      author: 'Edwin J. Purcell',
      publisher: 'Erlangga',
      year: 2018,
      category: 'Sains & Matematika',
      shelfCode: 'RAK-M2',
      totalStock: 3,
      borrowedCount: 0,
      availableStock: 3,
      createdAt: addDays(now, -18).toISOString(),
      updatedAt: todayIso,
    },
    {
      id: 'bk-12',
      isbn: '978-602-385-501-8',
      title: 'Pulang',
      author: 'Tere Liye',
      publisher: 'Republika Penerbit',
      year: 2015,
      category: 'Sastra & Fiksi',
      shelfCode: 'RAK-A4',
      totalStock: 4,
      borrowedCount: 0,
      availableStock: 4,
      createdAt: addDays(now, -15).toISOString(),
      updatedAt: todayIso,
    },
  ];

  const makeItems = (bookIds: string[]): LoanItem[] =>
    bookIds.map((id) => {
      const b = books.find((bk) => bk.id === id)!;
      return {
        bookId: b.id,
        title: b.title,
        author: b.author,
        shelfCode: b.shelfCode,
        feePerBook: LOAN_FEE_PER_BOOK,
      };
    });

  const loans: Loan[] = [
    {
      id: 'ln-101',
      code: 'PNJ-2026-0101',
      borrowerName: 'Rizky Pratama',
      borrowerIdNumber: 'ANG-2024-018',
      borrowerPhone: '0812-3456-7890',
      items: makeItems(['bk-03', 'bk-04']),
      totalBooks: 2,
      loanFee: 2000,
      borrowedAt: addDays(now, -11).toISOString(),
      dueDate: addDays(now, -4).toISOString(),
      returnedAt: null,
      lateDays: 0,
      lateFine: 0,
      fineSettled: false,
      status: 'active',
      processedById: 'lib-1',
      processedByName: librarians[0].name,
      returnedById: null,
      returnedByName: null,
      lastNotifiedAt: addDays(now, -1).toISOString(),
      notificationCount: 1,
      notes: 'Keperluan tugas akhir sistem informasi',
    },
    {
      id: 'ln-102',
      code: 'PNJ-2026-0102',
      borrowerName: 'Nadia Kusuma',
      borrowerIdNumber: 'ANG-2024-042',
      borrowerPhone: '0813-9876-5432',
      items: makeItems(['bk-05']),
      totalBooks: 1,
      loanFee: 1000,
      borrowedAt: addDays(now, -9).toISOString(),
      dueDate: addDays(now, -2).toISOString(),
      returnedAt: null,
      lateDays: 0,
      lateFine: 0,
      fineSettled: false,
      status: 'active',
      processedById: 'lib-2',
      processedByName: librarians[1].name,
      returnedById: null,
      returnedByName: null,
      lastNotifiedAt: null,
      notificationCount: 0,
      notes: '',
    },
    {
      id: 'ln-103',
      code: 'PNJ-2026-0103',
      borrowerName: 'Dimas Anggara',
      borrowerIdNumber: 'ANG-2025-009',
      borrowerPhone: '0857-2233-4455',
      items: makeItems(['bk-08', 'bk-11']),
      totalBooks: 2,
      loanFee: 2000,
      borrowedAt: addDays(now, -13).toISOString(),
      dueDate: addDays(now, -6).toISOString(),
      returnedAt: null,
      lateDays: 0,
      lateFine: 0,
      fineSettled: false,
      status: 'active',
      processedById: 'lib-1',
      processedByName: librarians[0].name,
      returnedById: null,
      returnedByName: null,
      lastNotifiedAt: null,
      notificationCount: 0,
      notes: 'Referensi olimpiade sains',
    },
    {
      id: 'ln-104',
      code: 'PNJ-2026-0104',
      borrowerName: 'Aulia Rahmawati',
      borrowerIdNumber: 'ANG-2025-031',
      borrowerPhone: '0821-7788-9900',
      items: makeItems(['bk-08']),
      totalBooks: 1,
      loanFee: 1000,
      borrowedAt: addDays(now, -6).toISOString(),
      dueDate: addDays(now, 1).toISOString(),
      returnedAt: null,
      lateDays: 0,
      lateFine: 0,
      fineSettled: false,
      status: 'active',
      processedById: 'lib-2',
      processedByName: librarians[1].name,
      returnedById: null,
      returnedByName: null,
      lastNotifiedAt: null,
      notificationCount: 0,
      notes: '',
    },
    {
      id: 'ln-105',
      code: 'PNJ-2026-0105',
      borrowerName: 'Fajar Hidayat',
      borrowerIdNumber: 'ANG-2024-087',
      borrowerPhone: '0819-3344-5566',
      items: makeItems(['bk-06', 'bk-10']),
      totalBooks: 2,
      loanFee: 2000,
      borrowedAt: addDays(now, -2).toISOString(),
      dueDate: addDays(now, 5).toISOString(),
      returnedAt: null,
      lateDays: 0,
      lateFine: 0,
      fineSettled: false,
      status: 'active',
      processedById: 'lib-1',
      processedByName: librarians[0].name,
      returnedById: null,
      returnedByName: null,
      lastNotifiedAt: null,
      notificationCount: 0,
      notes: '',
    },
    {
      id: 'ln-106',
      code: 'PNJ-2026-0106',
      borrowerName: 'Dewi Lestari',
      borrowerIdNumber: 'ANG-2025-014',
      borrowerPhone: '0878-1122-3344',
      items: makeItems(['bk-01', 'bk-09']),
      totalBooks: 2,
      loanFee: 2000,
      borrowedAt: todayIso,
      dueDate: addDays(now, 7).toISOString(),
      returnedAt: null,
      lateDays: 0,
      lateFine: 0,
      fineSettled: false,
      status: 'active',
      processedById: 'lib-2',
      processedByName: librarians[1].name,
      returnedById: null,
      returnedByName: null,
      lastNotifiedAt: null,
      notificationCount: 0,
      notes: 'Peminjaman reguler 7 hari',
    },
    {
      id: 'ln-098',
      code: 'PNJ-2026-0098',
      borrowerName: 'Hendra Wijaya',
      borrowerIdNumber: 'ANG-2023-055',
      borrowerPhone: '0812-8899-0011',
      items: makeItems(['bk-02']),
      totalBooks: 1,
      loanFee: 1000,
      borrowedAt: addDays(now, -10).toISOString(),
      dueDate: addDays(now, -3).toISOString(),
      returnedAt: addDays(now, -1).toISOString(),
      lateDays: 2,
      lateFine: 2000,
      fineSettled: true,
      status: 'returned',
      processedById: 'lib-1',
      processedByName: librarians[0].name,
      returnedById: 'lib-2',
      returnedByName: librarians[1].name,
      lastNotifiedAt: addDays(now, -2).toISOString(),
      notificationCount: 1,
      notes: 'Denda lunas tunai saat pengembalian',
    },
    {
      id: 'ln-099',
      code: 'PNJ-2026-0099',
      borrowerName: 'Sari Melati',
      borrowerIdNumber: 'ANG-2025-002',
      borrowerPhone: '0856-4455-6677',
      items: makeItems(['bk-07', 'bk-12']),
      totalBooks: 2,
      loanFee: 2000,
      borrowedAt: addDays(now, -8).toISOString(),
      dueDate: addDays(now, -1).toISOString(),
      returnedAt: addDays(now, -2).toISOString(),
      lateDays: 0,
      lateFine: 0,
      fineSettled: true,
      status: 'returned',
      processedById: 'lib-2',
      processedByName: librarians[1].name,
      returnedById: 'lib-1',
      returnedByName: librarians[0].name,
      lastNotifiedAt: null,
      notificationCount: 0,
      notes: 'Dikembalikan lebih awal',
    },
  ];

  const sampleNames = [
    'Ahmad Fauzan',
    'Putri Wulandari',
    'Bagas Saputra',
    'Citra Ayu',
    'Rendra Mahendra',
    'Intan Permata',
    'Yoga Pratama',
    'Salsa Nabila',
    'Kevin Tanuwijaya',
    'Maya Puspita',
    'Galih Ramadhan',
    'Tania Maharani',
    'Reza Pahlevi',
    'Novi Anggraini',
  ];
  const categories: VisitorCategory[] = ['Pelajar', 'Mahasiswa', 'Umum', 'Peneliti'];
  const purposes: VisitorPurpose[] = [
    'Baca di Tempat',
    'Peminjaman Buku',
    'Pengembalian Buku',
    'Riset & Referensi',
  ];

  const visitors: VisitorLog[] = [];
  let vCounter = 1;

  // Generate past 29 days of realistic visitor logs
  for (let dayOffset = 29; dayOffset >= 1; dayOffset--) {
    const dayDate = addDays(now, -dayOffset);
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
    const count = isWeekend ? 8 + ((dayOffset * 3) % 7) : 14 + ((dayOffset * 5) % 13);
    for (let i = 0; i < count; i++) {
      const hour = 8 + ((i * 2 + dayOffset) % 9); // 08:00 - 16:00
      const minute = (i * 17) % 60;
      const visited = setTimeOfDay(dayDate, hour, minute);
      const lib = (i + dayOffset) % 2 === 0 ? librarians[0] : librarians[1];
      visitors.push({
        id: `vis-${String(vCounter++).padStart(4, '0')}`,
        visitorName: sampleNames[(i + dayOffset) % sampleNames.length],
        memberId: `ANG-2025-${String(10 + ((i + dayOffset) % 85)).padStart(3, '0')}`,
        category: categories[(i + dayOffset) % categories.length],
        purpose: purposes[(i * 3 + dayOffset) % purposes.length],
        visitedAt: visited.toISOString(),
        dateKey: toLocalDateKey(visited),
        hour,
        recordedById: lib.id,
        recordedByName: lib.name,
      });
    }
  }

  // Generate today's visitor check-ins up to reasonable hours
  const todayEntries: Array<{
    name: string;
    memberId: string;
    cat: VisitorCategory;
    purpose: VisitorPurpose;
    hour: number;
    minute: number;
    libIdx: 0 | 1;
  }> = [
    { name: 'Dewi Lestari', memberId: 'ANG-2025-014', cat: 'Mahasiswa', purpose: 'Peminjaman Buku', hour: 8, minute: 25, libIdx: 0 },
    { name: 'Arif Kurniawan', memberId: 'ANG-2024-061', cat: 'Pelajar', purpose: 'Baca di Tempat', hour: 8, minute: 48, libIdx: 0 },
    { name: 'Bela Safitri', memberId: 'ANG-2025-022', cat: 'Mahasiswa', purpose: 'Riset & Referensi', hour: 9, minute: 15, libIdx: 0 },
    { name: 'Rama Aditya', memberId: 'UMUM-081', cat: 'Umum', purpose: 'Baca di Tempat', hour: 9, minute: 42, libIdx: 0 },
    { name: 'Larasati Dewi', memberId: 'ANG-2024-039', cat: 'Pelajar', purpose: 'Baca di Tempat', hour: 10, minute: 10, libIdx: 1 },
    { name: 'Ilham Akbar', memberId: 'ANG-2025-051', cat: 'Mahasiswa', purpose: 'Peminjaman Buku', hour: 10, minute: 35, libIdx: 1 },
    { name: 'Dr. Wahyu Nugroho', memberId: 'PNL-004', cat: 'Peneliti', purpose: 'Riset & Referensi', hour: 11, minute: 5, libIdx: 0 },
    { name: 'Sinta Permatasari', memberId: 'ANG-2024-077', cat: 'Mahasiswa', purpose: 'Baca di Tempat', hour: 11, minute: 40, libIdx: 1 },
    { name: 'Gilang Prasetyo', memberId: 'ANG-2025-019', cat: 'Pelajar', purpose: 'Pengembalian Buku', hour: 13, minute: 12, libIdx: 1 },
    { name: 'Farah Diba', memberId: 'ANG-2025-063', cat: 'Mahasiswa', purpose: 'Baca di Tempat', hour: 13, minute: 50, libIdx: 1 },
    { name: 'Taufik Hidayatullah', memberId: 'UMUM-109', cat: 'Umum', purpose: 'Riset & Referensi', hour: 14, minute: 20, libIdx: 0 },
    { name: 'Nadine Azzahra', memberId: 'ANG-2025-088', cat: 'Pelajar', purpose: 'Baca di Tempat', hour: 15, minute: 8, libIdx: 1 },
  ];

  for (const entry of todayEntries) {
    const visited = setTimeOfDay(now, entry.hour, entry.minute);
    const lib = librarians[entry.libIdx];
    visitors.push({
      id: `vis-${String(vCounter++).padStart(4, '0')}`,
      visitorName: entry.name,
      memberId: entry.memberId,
      category: entry.cat,
      purpose: entry.purpose,
      visitedAt: visited.toISOString(),
      dateKey: toLocalDateKey(visited),
      hour: entry.hour,
      recordedById: lib.id,
      recordedByName: lib.name,
    });
  }

  const notificationLogs: NotificationLog[] = [
    {
      id: 'ntf-001',
      loanId: 'ln-101',
      loanCode: 'PNJ-2026-0101',
      borrowerName: 'Rizky Pratama',
      borrowerPhone: '0812-3456-7890',
      type: 'overdue',
      lateDays: 3,
      estimatedFine: 6000,
      message:
        'Yth. Rizky Pratama, peminjaman kode PNJ-2026-0101 ("Algoritma & Struktur Data Modern", "Clean Code: Panduan Praktis") telah melewati jatuh tempo. Mohon segera mengembalikan buku ke PustakaNusa.',
      sentAt: addDays(now, -1).toISOString(),
      sentById: 'lib-1',
      sentByName: librarians[0].name,
      channel: 'WhatsApp',
    },
    {
      id: 'ntf-002',
      loanId: 'ln-098',
      loanCode: 'PNJ-2026-0098',
      borrowerName: 'Hendra Wijaya',
      borrowerPhone: '0812-8899-0011',
      type: 'overdue',
      lateDays: 1,
      estimatedFine: 1000,
      message:
        'Yth. Hendra Wijaya, pengingat keterlambatan untuk kode PNJ-2026-0098 ("Bumi Manusia"). Denda harian Rp 1.000/buku.',
      sentAt: addDays(now, -2).toISOString(),
      sentById: 'lib-2',
      sentByName: librarians[1].name,
      channel: 'WhatsApp',
    },
  ];

  const db: LibraryDatabase = {
    librarians,
    sessions: [],
    books,
    loans,
    visitors,
    notificationLogs,
  };
  syncBookStocks(db);
  return db;
}

function loadDatabase(): LibraryDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDatabase();
    saveDatabase(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as LibraryDatabase;
    syncBookStocks(parsed);
    return parsed;
  } catch {
    const fallback = createInitialDatabase();
    saveDatabase(fallback);
    return fallback;
  }
}

function saveDatabase(db: LibraryDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

let db: LibraryDatabase = loadDatabase();

function toPublicLibrarian(lib: LibrarianRecord): LibrarianPublic {
  return {
    id: lib.id,
    name: lib.name,
    role: lib.role,
    email: lib.email,
    initials: lib.initials,
    shift: lib.shift,
  };
}

function enrichLoan(loan: Loan, now: Date): EnrichedLoan {
  if (loan.status === 'returned') {
    return {
      ...loan,
      currentLateDays: loan.lateDays,
      currentLateFine: loan.lateFine,
      isOverdue: loan.lateDays > 0,
      isDueSoon: false,
    };
  }
  const currentLateDays = calculateLateDays(loan.dueDate, now);
  const currentLateFine = currentLateDays * LATE_FINE_PER_DAY_PER_BOOK * loan.totalBooks;
  const daysUntil = calculateDaysUntilDue(loan.dueDate, now);
  return {
    ...loan,
    currentLateDays,
    currentLateFine,
    isOverdue: currentLateDays > 0,
    isDueSoon: currentLateDays === 0 && daysUntil >= 0 && daysUntil <= 1,
  };
}

function computeAnalytics(dbState: LibraryDatabase, enrichedLoans: EnrichedLoan[]): DashboardAnalytics {
  const now = new Date();
  const todayDateKey = toLocalDateKey(now);
  const yesterdayDateKey = toLocalDateKey(addDays(now, -1));

  const todayVisitorsList = dbState.visitors.filter((v) => v.dateKey === todayDateKey);
  const yesterdayVisitorsList = dbState.visitors.filter((v) => v.dateKey === yesterdayDateKey);

  const activeLoans = enrichedLoans.filter((l) => l.status === 'active');
  const booksCurrentlyBorrowed = activeLoans.reduce((sum, l) => sum + l.totalBooks, 0);

  const totalStockUnits = dbState.books.reduce((sum, b) => sum + b.totalStock, 0);
  const availableStockUnits = dbState.books.reduce((sum, b) => sum + b.availableStock, 0);
  const lowStockBooksCount = dbState.books.filter(
    (b) => b.availableStock > 0 && b.availableStock <= 2,
  ).length;
  const outOfStockBooksCount = dbState.books.filter((b) => b.availableStock === 0).length;

  const totalLoanRevenue = dbState.loans.reduce((sum, l) => sum + l.loanFee, 0);
  const todayLoanRevenue = dbState.loans
    .filter((l) => toLocalDateKey(new Date(l.borrowedAt)) === todayDateKey)
    .reduce((sum, l) => sum + l.loanFee, 0);

  const totalCollectedFines = dbState.loans
    .filter((l) => l.fineSettled)
    .reduce((sum, l) => sum + l.lateFine, 0);

  const pendingFinesActive = activeLoans.reduce((sum, l) => sum + l.currentLateFine, 0);
  const pendingFinesReturnedUnpaid = enrichedLoans
    .filter((l) => l.status === 'returned' && !l.fineSettled)
    .reduce((sum, l) => sum + l.lateFine, 0);
  const pendingFinesTotal = pendingFinesActive + pendingFinesReturnedUnpaid;

  const overdueLoansCount = activeLoans.filter((l) => l.isOverdue).length;
  const dueSoonLoansCount = activeLoans.filter((l) => l.isDueSoon).length;

  // Build 30-day daily series
  const dailySeries = [];
  for (let offset = 29; offset >= 0; offset--) {
    const d = addDays(now, -offset);
    const key = toLocalDateKey(d);
    const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const visitors = dbState.visitors.filter((v) => v.dateKey === key).length;
    const loans = dbState.loans.filter(
      (l) => toLocalDateKey(new Date(l.borrowedAt)) === key,
    ).length;
    const returns = dbState.loans.filter(
      (l) => l.returnedAt && toLocalDateKey(new Date(l.returnedAt)) === key,
    ).length;
    dailySeries.push({ dateKey: key, label, visitors, loans, returns });
  }

  // Hourly distribution for today (08:00 - 17:00)
  const hourlyToday = [];
  for (let h = 8; h <= 17; h++) {
    hourlyToday.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      visitors: todayVisitorsList.filter((v) => v.hour === h).length,
    });
  }

  // Purpose breakdown (today)
  const purposeList: VisitorPurpose[] = [
    'Baca di Tempat',
    'Peminjaman Buku',
    'Pengembalian Buku',
    'Riset & Referensi',
  ];
  const todayTotal = todayVisitorsList.length || 1;
  const purposeBreakdown = purposeList.map((purpose) => {
    const count = todayVisitorsList.filter((v) => v.purpose === purpose).length;
    return {
      purpose,
      count,
      percentage: Math.round((count / todayTotal) * 100),
    };
  });

  // Category breakdown (today)
  const categoryList: VisitorCategory[] = ['Pelajar', 'Mahasiswa', 'Umum', 'Peneliti'];
  const categoryBreakdown = categoryList.map((category) => {
    const count = todayVisitorsList.filter((v) => v.category === category).length;
    return {
      category,
      count,
      percentage: Math.round((count / todayTotal) * 100),
    };
  });

  // Librarian stats
  const librarianStats = dbState.librarians.map((lib) => ({
    librarianId: lib.id,
    name: lib.name,
    role: lib.role,
    loansProcessed: dbState.loans.filter((l) => l.processedById === lib.id).length,
    returnsProcessed: dbState.loans.filter((l) => l.returnedById === lib.id).length,
    visitorsLogged: dbState.visitors.filter(
      (v) => v.recordedById === lib.id && v.dateKey === todayDateKey,
    ).length,
    notificationsSent: dbState.notificationLogs.filter((n) => n.sentById === lib.id).length,
  }));

  return {
    todayDateKey,
    visitorsToday: todayVisitorsList.length,
    visitorsYesterday: yesterdayVisitorsList.length,
    activeLoansCount: activeLoans.length,
    booksCurrentlyBorrowed,
    totalCatalogTitles: dbState.books.length,
    totalStockUnits,
    availableStockUnits,
    lowStockBooksCount,
    outOfStockBooksCount,
    totalLoanRevenue,
    todayLoanRevenue,
    totalCollectedFines,
    pendingFinesTotal,
    overdueLoansCount,
    dueSoonLoansCount,
    dailySeries,
    hourlyToday,
    purposeBreakdown,
    categoryBreakdown,
    librarianStats,
  };
}

interface AuthedRequest extends Request {
  librarian?: LibrarianRecord;
  sessionToken?: string;
}

function requireLibrarian(req: AuthedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Sesi pustakawan tidak ditemukan. Silakan masuk kembali.' });
    return;
  }
  const session = db.sessions.find((s) => s.token === token);
  if (!session) {
    res.status(401).json({ error: 'Sesi telah berakhir. Silakan pilih pustakawan dan masuk.' });
    return;
  }
  const lib = db.librarians.find((l) => l.id === session.librarianId);
  if (!lib) {
    res.status(401).json({ error: 'Akun pustakawan tidak valid.' });
    return;
  }
  req.librarian = lib;
  req.sessionToken = token;
  next();
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/auth/librarians', (_req, res) => {
    res.json({
      librarians: db.librarians.map(toPublicLibrarian),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { librarianId, pin } = req.body as { librarianId?: string; pin?: string };
    const lib = db.librarians.find((l) => l.id === librarianId);
    if (!lib) {
      res.status(404).json({ error: 'Akun pustakawan tidak ditemukan.' });
      return;
    }
    if (!pin || String(pin).trim() !== lib.pin) {
      res.status(401).json({ error: 'PIN pustakawan tidak sesuai.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions = db.sessions.slice(-19);
    db.sessions.push({
      token,
      librarianId: lib.id,
      createdAt: new Date().toISOString(),
    });
    saveDatabase(db);
    res.json({
      token,
      librarian: toPublicLibrarian(lib),
    });
  });

  app.post('/api/auth/logout', requireLibrarian, (req: AuthedRequest, res) => {
    if (req.sessionToken) {
      db.sessions = db.sessions.filter((s) => s.token !== req.sessionToken);
      saveDatabase(db);
    }
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireLibrarian, (req: AuthedRequest, res) => {
    res.json({ librarian: toPublicLibrarian(req.librarian!) });
  });

  app.get('/api/bootstrap', requireLibrarian, (req: AuthedRequest, res) => {
    const now = new Date();
    syncBookStocks(db);
    const enrichedLoans = db.loans
      .map((l) => enrichLoan(l, now))
      .sort((a, b) => new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime());

    const sortedVisitors = [...db.visitors].sort(
      (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime(),
    );

    const sortedNotifications = [...db.notificationLogs].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );

    const analytics = computeAnalytics(db, enrichedLoans);

    res.json({
      currentLibrarian: toPublicLibrarian(req.librarian!),
      librarians: db.librarians.map(toPublicLibrarian),
      books: db.books,
      loans: enrichedLoans,
      visitors: sortedVisitors,
      notificationLogs: sortedNotifications,
      analytics,
      constants: {
        loanFeePerBook: LOAN_FEE_PER_BOOK,
        lateFinePerDayPerBook: LATE_FINE_PER_DAY_PER_BOOK,
      },
    });
  });

  app.post('/api/books', requireLibrarian, (req: AuthedRequest, res) => {
    const { isbn, title, author, publisher, year, category, shelfCode, totalStock } = req.body as {
      isbn?: string;
      title?: string;
      author?: string;
      publisher?: string;
      year?: number;
      category?: string;
      shelfCode?: string;
      totalStock?: number;
    };

    if (!title?.trim() || !author?.trim() || !category?.trim() || !shelfCode?.trim()) {
      res.status(400).json({ error: 'Judul, penulis, kategori, dan kode rak wajib diisi.' });
      return;
    }
    const stockNum = Number(totalStock);
    if (!Number.isInteger(stockNum) || stockNum < 1 || stockNum > 500) {
      res.status(400).json({ error: 'Stok total harus berupa angka antara 1 hingga 500.' });
      return;
    }
    const yearNum = Number(year) || new Date().getFullYear();
    const nowIso = new Date().toISOString();
    const newBook: Book = {
      id: `bk-${crypto.randomUUID().slice(0, 8)}`,
      isbn: isbn?.trim() || `978-${Math.floor(100000000 + Math.random() * 900000000)}`,
      title: title.trim(),
      author: author.trim(),
      publisher: publisher?.trim() || 'Penerbit Umum',
      year: yearNum,
      category: category.trim(),
      shelfCode: shelfCode.trim().toUpperCase(),
      totalStock: stockNum,
      borrowedCount: 0,
      availableStock: stockNum,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.books.unshift(newBook);
    syncBookStocks(db);
    saveDatabase(db);
    res.status(201).json({ book: newBook });
  });

  app.patch('/api/books/:id', requireLibrarian, (req: AuthedRequest, res) => {
    const book = db.books.find((b) => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Buku tidak ditemukan di katalog.' });
      return;
    }
    const { isbn, title, author, publisher, year, category, shelfCode, totalStock } = req.body as Partial<{
      isbn: string;
      title: string;
      author: string;
      publisher: string;
      year: number;
      category: string;
      shelfCode: string;
      totalStock: number;
    }>;

    if (totalStock !== undefined) {
      const nextStock = Number(totalStock);
      if (!Number.isInteger(nextStock) || nextStock < book.borrowedCount) {
        res.status(400).json({
          error: `Total stok tidak boleh kurang dari jumlah buku yang sedang dipinjam (${book.borrowedCount}).`,
        });
        return;
      }
      book.totalStock = nextStock;
    }
    if (isbn !== undefined && isbn.trim()) book.isbn = isbn.trim();
    if (title !== undefined && title.trim()) book.title = title.trim();
    if (author !== undefined && author.trim()) book.author = author.trim();
    if (publisher !== undefined && publisher.trim()) book.publisher = publisher.trim();
    if (year !== undefined && Number(year) > 1800) book.year = Number(year);
    if (category !== undefined && category.trim()) book.category = category.trim();
    if (shelfCode !== undefined && shelfCode.trim()) book.shelfCode = shelfCode.trim().toUpperCase();
    book.updatedAt = new Date().toISOString();

    syncBookStocks(db);
    saveDatabase(db);
    res.json({ book });
  });

  app.delete('/api/books/:id', requireLibrarian, (req: AuthedRequest, res) => {
    const book = db.books.find((b) => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Buku tidak ditemukan.' });
      return;
    }
    if (book.borrowedCount > 0) {
      res.status(400).json({
        error: `Buku tidak dapat dihapus karena ${book.borrowedCount} eksemplar masih dipinjam.`,
      });
      return;
    }
    db.books = db.books.filter((b) => b.id !== book.id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  app.post('/api/loans', requireLibrarian, (req: AuthedRequest, res) => {
    const {
      borrowerName,
      borrowerIdNumber,
      borrowerPhone,
      bookIds,
      durationDays,
      notes,
      autoLogVisitor,
      visitorCategory,
    } = req.body as {
      borrowerName?: string;
      borrowerIdNumber?: string;
      borrowerPhone?: string;
      bookIds?: string[];
      durationDays?: number;
      notes?: string;
      autoLogVisitor?: boolean;
      visitorCategory?: VisitorCategory;
    };

    if (!borrowerName?.trim() || !borrowerPhone?.trim()) {
      res.status(400).json({ error: 'Nama peminjam dan nomor telepon/WhatsApp wajib diisi.' });
      return;
    }
    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      res.status(400).json({ error: 'Pilih minimal 1 buku untuk dipinjam.' });
      return;
    }
    if (bookIds.length > 10) {
      res.status(400).json({ error: 'Maksimal 10 buku per transaksi peminjaman.' });
      return;
    }

    syncBookStocks(db);

    // Check duplicates and availability
    const requestedCounts = new Map<string, number>();
    for (const id of bookIds) {
      requestedCounts.set(id, (requestedCounts.get(id) || 0) + 1);
    }

    const items: LoanItem[] = [];
    for (const [bookId, count] of requestedCounts.entries()) {
      const book = db.books.find((b) => b.id === bookId);
      if (!book) {
        res.status(404).json({ error: 'Salah satu buku yang dipilih tidak ditemukan.' });
        return;
      }
      if (book.availableStock < count) {
        res.status(400).json({
          error: `Stok buku "${book.title}" tidak mencukupi (tersedia: ${book.availableStock}).`,
        });
        return;
      }
      for (let i = 0; i < count; i++) {
        items.push({
          bookId: book.id,
          title: book.title,
          author: book.author,
          shelfCode: book.shelfCode,
          feePerBook: LOAN_FEE_PER_BOOK,
        });
      }
    }

    const days = Math.max(1, Math.min(30, Number(durationDays) || 7));
    const now = new Date();
    const dueDate = addDays(now, days);
    const nextNum = 100 + db.loans.length + 1;
    const librarian = req.librarian!;

    const newLoan: Loan = {
      id: `ln-${crypto.randomUUID().slice(0, 8)}`,
      code: `PNJ-${now.getFullYear()}-${String(nextNum).padStart(4, '0')}`,
      borrowerName: borrowerName.trim(),
      borrowerIdNumber: borrowerIdNumber?.trim() || `UMUM-${String(nextNum).padStart(3, '0')}`,
      borrowerPhone: borrowerPhone.trim(),
      items,
      totalBooks: items.length,
      loanFee: items.length * LOAN_FEE_PER_BOOK,
      borrowedAt: now.toISOString(),
      dueDate: dueDate.toISOString(),
      returnedAt: null,
      lateDays: 0,
      lateFine: 0,
      fineSettled: false,
      status: 'active',
      processedById: librarian.id,
      processedByName: librarian.name,
      returnedById: null,
      returnedByName: null,
      lastNotifiedAt: null,
      notificationCount: 0,
      notes: notes?.trim() || '',
    };

    db.loans.unshift(newLoan);
    syncBookStocks(db);

    if (autoLogVisitor) {
      db.visitors.unshift({
        id: `vis-${crypto.randomUUID().slice(0, 8)}`,
        visitorName: newLoan.borrowerName,
        memberId: newLoan.borrowerIdNumber,
        category: visitorCategory || 'Umum',
        purpose: 'Peminjaman Buku',
        visitedAt: now.toISOString(),
        dateKey: toLocalDateKey(now),
        hour: now.getHours(),
        recordedById: librarian.id,
        recordedByName: librarian.name,
      });
    }

    saveDatabase(db);
    res.status(201).json({ loan: newLoan });
  });

  app.post('/api/loans/:id/return', requireLibrarian, (req: AuthedRequest, res) => {
    const loan = db.loans.find((l) => l.id === req.params.id);
    if (!loan) {
      res.status(404).json({ error: 'Data peminjaman tidak ditemukan.' });
      return;
    }
    if (loan.status === 'returned') {
      res.status(400).json({ error: 'Buku pada transaksi ini sudah dikembalikan sebelumnya.' });
      return;
    }

    const { settleFine } = req.body as { settleFine?: boolean };
    const now = new Date();
    const lateDays = calculateLateDays(loan.dueDate, now);
    const lateFine = lateDays * LATE_FINE_PER_DAY_PER_BOOK * loan.totalBooks;
    const librarian = req.librarian!;

    loan.status = 'returned';
    loan.returnedAt = now.toISOString();
    loan.lateDays = lateDays;
    loan.lateFine = lateFine;
    loan.fineSettled = lateFine === 0 ? true : Boolean(settleFine);
    loan.returnedById = librarian.id;
    loan.returnedByName = librarian.name;

    syncBookStocks(db);
    saveDatabase(db);
    res.json({ loan });
  });

  app.post('/api/loans/:id/settle-fine', requireLibrarian, (req: AuthedRequest, res) => {
    const loan = db.loans.find((l) => l.id === req.params.id);
    if (!loan) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
      return;
    }
    loan.fineSettled = true;
    saveDatabase(db);
    res.json({ loan });
  });

  app.post('/api/notifications/send', requireLibrarian, (req: AuthedRequest, res) => {
    const { loanId, channel, message } = req.body as {
      loanId?: string;
      channel?: NotificationChannel;
      message?: string;
    };
    const loan = db.loans.find((l) => l.id === loanId);
    if (!loan) {
      res.status(404).json({ error: 'Transaksi peminjaman tidak ditemukan.' });
      return;
    }
    if (!message?.trim()) {
      res.status(400).json({ error: 'Isi pesan notifikasi tidak boleh kosong.' });
      return;
    }

    const now = new Date();
    const lateDays = calculateLateDays(loan.dueDate, now);
    const estimatedFine = lateDays * LATE_FINE_PER_DAY_PER_BOOK * loan.totalBooks;
    const librarian = req.librarian!;

    loan.lastNotifiedAt = now.toISOString();
    loan.notificationCount = (loan.notificationCount || 0) + 1;

    const notif: NotificationLog = {
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      loanId: loan.id,
      loanCode: loan.code,
      borrowerName: loan.borrowerName,
      borrowerPhone: loan.borrowerPhone,
      type: lateDays > 0 ? 'overdue' : 'due_soon',
      lateDays,
      estimatedFine,
      message: message.trim(),
      sentAt: now.toISOString(),
      sentById: librarian.id,
      sentByName: librarian.name,
      channel: channel || 'WhatsApp',
    };

    db.notificationLogs.unshift(notif);
    saveDatabase(db);
    res.status(201).json({ notification: notif });
  });

  app.post('/api/visitors', requireLibrarian, (req: AuthedRequest, res) => {
    const { visitorName, memberId, category, purpose } = req.body as {
      visitorName?: string;
      memberId?: string;
      category?: VisitorCategory;
      purpose?: VisitorPurpose;
    };
    if (!visitorName?.trim()) {
      res.status(400).json({ error: 'Nama pengunjung wajib diisi.' });
      return;
    }
    const now = new Date();
    const librarian = req.librarian!;
    const visitor: VisitorLog = {
      id: `vis-${crypto.randomUUID().slice(0, 8)}`,
      visitorName: visitorName.trim(),
      memberId: memberId?.trim() || 'NON-ANGGOTA',
      category: category || 'Umum',
      purpose: purpose || 'Baca di Tempat',
      visitedAt: now.toISOString(),
      dateKey: toLocalDateKey(now),
      hour: now.getHours(),
      recordedById: librarian.id,
      recordedByName: librarian.name,
    };

    db.visitors.unshift(visitor);
    saveDatabase(db);
    res.status(201).json({ visitor });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PustakaNusa server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
