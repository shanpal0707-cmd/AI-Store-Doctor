import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';

// ── Product shape ─────────────────────────────────────────────
export interface ProductData {
  _id?:          string;
  id?:           number;   // legacy localStorage id kept for backward compat
  userId?:       string;
  productName:   string;
  category:      string;
  costPrice:     number;
  sellingPrice:  number;
  stockQuantity: number;
  unitsSold:     number;
  salesPeriod:   string;
  createdAt?:    string;
  updatedAt?:    string;
}

interface ProductListResponse {
  products: ProductData[];
}

interface ProductResponse {
  product: ProductData;
}

// ── ProductService ────────────────────────────────────────────
/**
 * Handles all /api/products HTTP calls.
 * Components fall back to localStorage when the backend is unavailable.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly url = '/api/products';

  constructor(private http: HttpClient) {}

  /** Fetch all products for the authenticated user. */
  getProducts(): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(this.url, { withCredentials: true });
  }

  /** Add a new product for the authenticated user. */
  addProduct(data: Omit<ProductData, '_id' | 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.url, data, { withCredentials: true });
  }

  /** Delete a product by its MongoDB _id. */
  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/${id}`, { withCredentials: true });
  }
}
