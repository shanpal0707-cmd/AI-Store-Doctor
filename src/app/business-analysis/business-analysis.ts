import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalysisService, AnalysisResult } from '../services/analysis.service';
import { StoreService }   from '../services/store.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-business-analysis',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './business-analysis.html',
  styleUrl: './business-analysis.css'
})
export class BusinessAnalysis implements OnInit {

  // ==============================
  // STORE DATA
  // ==============================

  storeName    = 'My Store';
  businessType = 'Retail Business';
  primaryGoal  = 'Overall Business Analysis';

  // ==============================
  // BUSINESS METRICS
  // ==============================

  productCount   = 0;
  totalUnitsSold = 0;
  totalStock     = 0;
  totalRevenue   = 0;
  totalCost      = 0;
  totalProfit    = 0;
  profitMargin   = 0;
  salesRate      = 0;
  businessScore  = 0;

  // ==============================
  // STATUS
  // ==============================

  performanceLabel = 'No Data';

  // ==============================
  // PRODUCT DATA
  // ==============================

  products: any[] = [];
  storeData: any  = {};

  // ==============================
  // AI STATE
  // ==============================

  isLoading        = false;
  analysisComplete = false;
  errorMessage     = '';
  aiResult: AnalysisResult | null = null;

  constructor(
    private analysisService: AnalysisService,
    private storeService:    StoreService,
    private productService:  ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStoreData();
    this.loadBusinessData();
  }

  // ==============================
  // LOAD STORE DATA — DB → localStorage fallback
  // ==============================

  private loadStoreData(): void {
    this.storeService.getStore().subscribe({
      next: (res) => {
        const store = res.store;
        if (store) {
          this.storeData    = store;
          this.storeName    = store.storeName    || 'My Store';
          this.businessType = store.businessType || 'Retail Business';
          this.primaryGoal  = store.primaryGoal  || 'Overall Business Analysis';
          localStorage.setItem('storeData', JSON.stringify(store));
        } else {
          this.loadStoreFromLocalStorage();
        }
      },
      error: () => this.loadStoreFromLocalStorage()
    });
  }

  private loadStoreFromLocalStorage(): void {
    const rawStore = localStorage.getItem('storeData');
    if (!rawStore) { return; }
    try {
      const store       = JSON.parse(rawStore);
      this.storeData    = store;
      this.storeName    = store.storeName    || 'My Store';
      this.businessType = store.businessType || 'Retail Business';
      this.primaryGoal  = store.primaryGoal  || 'Overall Business Analysis';
    } catch (error) {
      console.error('[Business Analysis] Store data error:', error);
    }
  }

  // ==============================
  // LOAD PRODUCT DATA — DB → localStorage fallback
  // ==============================

  private loadBusinessData(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products = res.products;
        localStorage.setItem('products', JSON.stringify(this.products));
        this.computeMetrics();
        this.cdr.detectChanges();
      },
      error: () => {
        const rawProducts = localStorage.getItem('products');
        try {
          this.products = rawProducts ? JSON.parse(rawProducts) : [];
        } catch {
          this.products = [];
        }
        this.computeMetrics();
        this.cdr.detectChanges();
      }
    });
  }

  private computeMetrics(): void {
    this.productCount = this.products.length;
    if (this.productCount === 0) { return; }

    this.totalUnitsSold = 0;
    this.totalStock     = 0;
    this.totalRevenue   = 0;
    this.totalCost      = 0;

    this.products.forEach(product => {
      const sellingPrice = Number(product.sellingPrice) || 0;
      const costPrice    = Number(product.costPrice)    || 0;
      const stock        = Number(product.stockQuantity) || 0;
      const sold         = Number(product.unitsSold)    || 0;
      this.totalUnitsSold += sold;
      this.totalStock     += stock;
      this.totalRevenue   += sellingPrice * sold;
      this.totalCost      += costPrice    * sold;
    });

    this.totalProfit = this.totalRevenue - this.totalCost;

    if (this.totalRevenue > 0) {
      this.profitMargin = Math.round((this.totalProfit / this.totalRevenue) * 100);
    }

    const totalUnits = this.totalStock + this.totalUnitsSold;
    if (totalUnits > 0) {
      this.salesRate = Math.round((this.totalUnitsSold / totalUnits) * 100);
    }

    this.calculateBusinessScore();
  }

  // ==============================
  // BUSINESS SCORE
  // ==============================

  private calculateBusinessScore(): void {
    let score = 50;
    if      (this.salesRate >= 50) { score += 25; }
    else if (this.salesRate >= 25) { score += 15; }
    else                           { score -= 10; }
    if      (this.profitMargin >= 30) { score += 20; }
    else if (this.profitMargin >= 15) { score += 10; }
    else if (this.profitMargin <= 0)  { score -= 20; }
    if (this.totalStock > 0 && this.totalUnitsSold > 0) {
      const stockRatio = this.totalStock / this.totalUnitsSold;
      if (stockRatio > 5) { score -= 10; }
    }
    this.businessScore = Math.max(0, Math.min(100, score));
    if      (this.businessScore >= 75) { this.performanceLabel = 'Good'; }
    else if (this.businessScore >= 50) { this.performanceLabel = 'Fair'; }
    else                               { this.performanceLabel = 'Needs Work'; }
  }

  // ==============================
  // PROFIT CSS CLASS
  // ==============================

  getProfitClass(): string {
    if (this.totalProfit > 0) { return 'positive'; }
    if (this.totalProfit < 0) { return 'negative'; }
    return 'neutral';
  }

  // ==============================
  // AI ANALYSIS
  // ==============================

  analyzeBusinessAI(): void {
    // Re-read latest data before calling AI
    this.loadStoreData();
    this.loadBusinessData();

    if (this.products.length === 0) {
      this.errorMessage     = 'Please add products first before running AI analysis.';
      this.analysisComplete = true;
      this.isLoading        = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading        = true;
    this.analysisComplete = false;
    this.errorMessage     = '';
    this.aiResult         = null;
    this.cdr.detectChanges();

    this.analysisService.analyze(this.storeData, this.products).subscribe({
      next: (data: AnalysisResult) => {
        this.aiResult         = data;
        this.isLoading        = false;
        this.analysisComplete = true;
        this.errorMessage     = '';
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isLoading        = false;
        this.analysisComplete = true;
        this.aiResult         = null;
        this.errorMessage     =
          error?.error?.error ||
          error?.message ||
          'AI analysis failed. Please check the backend and try again.';
        this.cdr.detectChanges();
      }
    });
  }

  // ==============================
  // AI RESULT HELPERS
  // ==============================

  get aiSummary():           string { return this.aiResult?.summary           || ''; }
  get aiScore():             number { return this.aiResult?.overallScore       ?? 0;  }
  get aiTopRecommendation(): string { return this.aiResult?.topRecommendation  || ''; }
  get aiHealthyCount():      number { return this.aiResult?.healthyCount       ?? 0;  }
  get aiAttentionCount():    number { return this.aiResult?.attentionCount     ?? 0;  }
  get aiProducts()                  { return this.aiResult?.products           ?? [];  }

  getAiStatusClass(status: string): string {
    switch (status) {
      case 'Healthy':         return 'status-healthy';
      case 'Needs Attention': return 'status-attention';
      case 'Critical':        return 'status-critical';
      default:                return 'status-critical';
    }
  }
}
