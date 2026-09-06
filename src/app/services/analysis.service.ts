import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AnalysedProduct {
  id: number;
  productName: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  unitsSold: number;
  salesPeriod: string;
  profit: number;
  salesRate: number;
  healthScore: number;
  healthStatus: 'Healthy' | 'Needs Attention' | 'Critical';
  salesPerformance: string;
  profitability: string;
  inventoryRisk: string;
  keyProblem: string;
  recommendedAction: string;
}

export interface AnalysisResult {
  analysisStatus: string;
  productCount: number;
  attentionCount: number;
  healthyCount: number;
  overallScore: number;
  summary: string;
  topRecommendation: string;
  products: AnalysedProduct[];
}

export interface AnalysisError {
  error: string;
}

@Injectable({ providedIn: 'root' })
export class AnalysisService {

  private readonly url = `${environment.apiUrl}/analyze`;

  constructor(private http: HttpClient) {}

  analyze(store: object, products: object[]): Observable<AnalysisResult> {
    return this.http.post<AnalysisResult>(this.url, { store, products });
  }

}
