import { Injectable }   from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Observable }   from 'rxjs';

// ── Store shape ───────────────────────────────────────────────
export interface StoreData {
  _id?:         string;
  userId?:      string;
  storeName:    string;
  businessType: string;
  storeSize:    string;
  primaryGoal:  string;
  createdAt?:   string;
  updatedAt?:   string;
}

interface StoreResponse {
  store: StoreData | null;
}

// ── StoreService ──────────────────────────────────────────────
/**
 * Handles all /api/store HTTP calls.
 * Components call these methods and fall back to localStorage
 * when the backend is unavailable (DB not yet set up / offline).
 */
@Injectable({ providedIn: 'root' })
export class StoreService {

  private readonly url = '/api/store';

  constructor(private http: HttpClient) {}

  /** Fetch the current user's store profile. */
  getStore(): Observable<StoreResponse> {
    return this.http.get<StoreResponse>(this.url, { withCredentials: true });
  }

  /** Create or fully replace the current user's store profile. */
  saveStore(data: Omit<StoreData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<StoreResponse> {
    return this.http.put<StoreResponse>(this.url, data, { withCredentials: true });
  }
}
