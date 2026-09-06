import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  MarketService,
  MarketIntelligenceResult,
  TrendingProduct,
  PricingOpportunity,
  CategoryOpportunity
} from '../services/market.service';
import { StoreService }   from '../services/store.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-market-intelligence',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './market-intelligence.html',
  styleUrl: './market-intelligence.css'
})
export class MarketIntelligence implements OnInit {

  // ── Raw data ────────────────────────────────────────────────
  products: any[] = [];
  storeData: any  = {};

  // ── UI state ────────────────────────────────────────────────
  isLoading        = false;
  analysisStarted  = false;
  analysisComplete = false;
  errorMessage     = '';

  // ── Result ──────────────────────────────────────────────────
  result: MarketIntelligenceResult | null = null;

  constructor(
    private marketService:   MarketService,
    private storeService:    StoreService,
    private productService:  ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFromStorage();
  }

  // ── Load data: DB → localStorage fallback ──────────────────
  loadFromStorage(): void {
    // Store
    this.storeService.getStore().subscribe({
      next: (res) => {
        if (res.store) {
          this.storeData = res.store;
          localStorage.setItem('storeData', JSON.stringify(res.store));
        } else {
          try {
            const raw = localStorage.getItem('storeData');
            this.storeData = raw ? JSON.parse(raw) : {};
          } catch { this.storeData = {}; }
        }
      },
      error: () => {
        try {
          const raw = localStorage.getItem('storeData');
          this.storeData = raw ? JSON.parse(raw) : {};
        } catch { this.storeData = {}; }
      }
    });

    // Products
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products = res.products;
        localStorage.setItem('products', JSON.stringify(this.products));
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const raw = localStorage.getItem('products');
          this.products = raw ? JSON.parse(raw) : [];
        } catch { this.products = []; }
        this.cdr.detectChanges();
      }
    });
  }

  // ── Convenience getters ─────────────────────────────────────
  get marketScore():           number               { return this.result?.marketScore          ?? 0;  }
  get marketOverview():        string               { return this.result?.marketOverview       ?? ''; }
  get topOpportunity():        string               { return this.result?.topOpportunity       ?? ''; }
  get seasonalInsight():       string               { return this.result?.seasonalInsight      ?? ''; }
  get demandSignals():         string[]             { return this.result?.demandSignals        ?? []; }
  get trendingProducts():      TrendingProduct[]    { return this.result?.trendingProducts     ?? []; }
  get pricingOpportunities():  PricingOpportunity[] { return this.result?.pricingOpportunities ?? []; }
  get categoryOpportunities(): CategoryOpportunity[]{ return this.result?.categoryOpportunities ?? []; }
  get aiRecommendations():     string[]             { return this.result?.aiRecommendations    ?? []; }

  // ── Main action ─────────────────────────────────────────────
  runAnalysis(): void {
    this.loadFromStorage();

    if (this.products.length === 0) {
      this.analysisStarted  = true;
      this.analysisComplete = true;
      this.isLoading        = false;
      this.errorMessage     = 'Please add at least one product before running Market Intelligence.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading        = true;
    this.analysisStarted  = true;
    this.analysisComplete = false;
    this.errorMessage     = '';
    this.result           = null;
    this.cdr.detectChanges();

    this.marketService.analyze(this.storeData, this.products).subscribe({
      next: (data: MarketIntelligenceResult) => {
        this.result           = data;
        this.isLoading        = false;
        this.analysisComplete = true;
        this.errorMessage     = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading        = false;
        this.analysisComplete = true;
        this.result           = null;
        this.errorMessage     =
          err?.error?.error ||
          err?.message ||
          'Market intelligence could not be generated. Please check the backend is running and your Gemini API key is configured.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Score label ─────────────────────────────────────────────
  getScoreLabel(): string {
    if (this.marketScore >= 75) return 'Strong';
    if (this.marketScore >= 50) return 'Moderate';
    return 'Developing';
  }

  getScoreClass(): string {
    if (this.marketScore >= 75) return 'score-strong';
    if (this.marketScore >= 50) return 'score-moderate';
    return 'score-developing';
  }
}
