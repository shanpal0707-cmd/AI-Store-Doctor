import { Injectable, signal } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable, tap }    from 'rxjs';

// ── Response shape from /api/auth/* ──────────────────────────
export interface AuthUser {
  id:        string;
  fullName:  string;
  email:     string;
  createdAt?: string;
}

interface AuthResponse {
  message: string;
  user:    AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

// ── AuthService ───────────────────────────────────────────────
/**
 * Handles all authentication API calls.
 *
 * The JWT is stored in an HttpOnly cookie managed by the browser —
 * Angular code NEVER reads or writes the token directly.
 *
 * A reactive `currentUser` signal holds the authenticated user in
 * memory so all components can read it without extra HTTP calls.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly base = '/api/auth';

  /** In-memory user state. null = not authenticated / not yet loaded. */
  readonly currentUser = signal<AuthUser | null>(null);

  /** True after fetchMe() has been called at least once. */
  readonly authChecked = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  // ── Signup ──────────────────────────────────────────────────

  signup(fullName: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/signup`, { fullName, email, password }, { withCredentials: true })
      .pipe(tap(res => this.currentUser.set(res.user)));
  }

  // ── Login ───────────────────────────────────────────────────

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, { email, password }, { withCredentials: true })
      .pipe(tap(res => this.currentUser.set(res.user)));
  }

  // ── Logout ──────────────────────────────────────────────────

  logout(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.currentUser.set(null)));
  }

  // ── Fetch current user (called on app init / profile load) ──

  fetchMe(): Observable<MeResponse> {
    return this.http
      .get<MeResponse>(`${this.base}/me`, { withCredentials: true })
      .pipe(
        tap({
          next:  res  => { this.currentUser.set(res.user); this.authChecked.set(true); },
          error: ()   => { this.currentUser.set(null);     this.authChecked.set(true); }
        })
      );
  }
}
