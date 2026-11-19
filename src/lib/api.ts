import type {
  Book,
  BootstrapPayload,
  LibrarianId,
  LibrarianPublic,
  Loan,
  NotificationChannel,
  NotificationLog,
  VisitorCategory,
  VisitorLog,
  VisitorPurpose,
} from '../types/library';

const TOKEN_STORAGE_KEY = 'pustakanusa_librarian_token';

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage unavailability
  }
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : `Permintaan gagal (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  getLibrarians(): Promise<{ librarians: LibrarianPublic[] }> {
    return apiRequest('/api/auth/librarians');
  },

  login(librarianId: LibrarianId, pin: string): Promise<{ token: string; librarian: LibrarianPublic }> {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ librarianId, pin }),
    });
  },

  logout(): Promise<{ ok: boolean }> {
    return apiRequest('/api/auth/logout', { method: 'POST' });
  },

  getBootstrap(): Promise<BootstrapPayload> {
    return apiRequest('/api/bootstrap');
  },

  createBook(payload: {
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    year: number;
    category: string;
    shelfCode: string;
    totalStock: number;
  }): Promise<{ book: Book }> {
    return apiRequest('/api/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateBook(
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
  ): Promise<{ book: Book }> {
    return apiRequest(`/api/books/${encodeURIComponent(bookId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteBook(bookId: string): Promise<{ ok: boolean }> {
    return apiRequest(`/api/books/${encodeURIComponent(bookId)}`, {
      method: 'DELETE',
    });
  },

  createLoan(payload: {
    borrowerName: string;
    borrowerIdNumber: string;
    borrowerPhone: string;
    bookIds: string[];
    durationDays: number;
    notes?: string;
    autoLogVisitor?: boolean;
    visitorCategory?: VisitorCategory;
  }): Promise<{ loan: Loan }> {
    return apiRequest('/api/loans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  returnLoan(
    loanId: string,
    payload: { settleFine: boolean },
  ): Promise<{ loan: Loan }> {
    return apiRequest(`/api/loans/${encodeURIComponent(loanId)}/return`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  settleLoanFine(loanId: string): Promise<{ loan: Loan }> {
    return apiRequest(`/api/loans/${encodeURIComponent(loanId)}/settle-fine`, {
      method: 'POST',
    });
  },

  sendNotification(payload: {
    loanId: string;
    channel: NotificationChannel;
    message: string;
  }): Promise<{ notification: NotificationLog }> {
    return apiRequest('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createVisitor(payload: {
    visitorName: string;
    memberId: string;
    category: VisitorCategory;
    purpose: VisitorPurpose;
  }): Promise<{ visitor: VisitorLog }> {
    return apiRequest('/api/visitors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
