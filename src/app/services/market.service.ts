import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TrendingProduct {
  productName: string;
  category: string;
  demandSignal: string;
  opportunity: string;
}

export interface PricingOpportunity {
  productName: string;
  currentPrice: number;
  suggestion: string;
  potentialImpact: string;
}

export interface CategoryOpportunity {
  category: string;
  insight: string;
  recommendation: string;
}

export interface MarketIntelligenceResult {
  marketOverview: string;
  marketScore: number;
  topOpportunity: string;
  demandSignals: string[];
  trendingProducts: TrendingProduct[];
  pricingOpportunities: PricingOpportunity[];
  categoryOpportunities: CategoryOpportunity[];
  aiRecommendations: string[];
  seasonalInsight: string;
}

@Injectable({ providedIn: 'root' })
export class MarketService {

  private readonly url = `${environment.apiUrl}/market-intelligence`;

  constructor(private http: HttpClient) {}

  analyze(store: object, products: object[]): Observable<MarketIntelligenceResult> {
    return this.http.post<MarketIntelligenceResult>(this.url, { store, products });
  }
}
