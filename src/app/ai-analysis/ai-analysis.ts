import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalysisService, AnalysisResult, AnalysedProduct } from '../services/analysis.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-ai-analysis',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ai-analysis.html',
  styleUrl: './ai-analysis.css'
})
export class AiAnalysis implements OnInit {

  // ── Raw product data ────────────────────────────────────────
  products: any[] = [];
  storeData: any  = {};

  // ── UI state ────────────────────────────────────────────────
  isLoading        = false;
  analysisStarted  = false;
  analysisComplete = false;
  errorMessage     = '';

  // ── Status label (shown in the AI badge) ───────────────────
  analysisStatus = 'Waiting for analysis';

  // ── Result data from the backend ───────────────────────────
  result: AnalysisResult | null = null;

  constructor(
    private analysisService: AnalysisService,
    private productService:  ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFromStorage();
  }

  // ── Read data: DB → localStorage fallback ──────────────────
  loadFromStorage(): void {
    // Store data — localStorage only this phase
    try {
      const rawStore = localStorage.getItem('storeData');
      this.storeData = rawStore ? JSON.parse(rawStore) : {};
    } catch {
      this.storeData = {};
    }

    // Products — DB first
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
        } catch {
          this.products = [];
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ── Shortcut getters used by the template ──────────────────
  get productCount():   number { return this.result?.productCount   ?? 0; }
  get attentionCount(): number { return this.result?.attentionCount ?? 0; }
  get healthyCount():   number { return this.result?.healthyCount   ?? 0; }
  get analysedProducts(): AnalysedProduct[] { return this.result?.products ?? []; }

  // ── Main action — called by the button ─────────────────────
  analyzeProducts(): void {
    this.loadFromStorage();

    // Guard: no products (check immediately from current state)
    if (this.products.length === 0) {
      this.analysisStarted  = true;
      this.analysisComplete = true;
      this.isLoading        = false;
      this.analysisStatus   = 'No products found';
      this.errorMessage     = 'Please add at least one product before starting the AI analysis.';
      this.cdr.detectChanges();
      return;
    }

    // Reset state
    this.isLoading        = true;
    this.analysisStarted  = true;
    this.analysisComplete = false;
    this.errorMessage     = '';
    this.result           = null;
    this.analysisStatus   = 'Analyzing with Gemini AI...';
    this.cdr.detectChanges();

    this.analysisService.analyze(this.storeData, this.products).subscribe({
      next: (data: AnalysisResult) => {
        this.result           = data;
        this.isLoading        = false;
        this.analysisComplete = true;
        this.errorMessage     = '';
        this.analysisStatus   = data.analysisStatus || 'Analysis complete';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading        = false;
        this.analysisComplete = true;
        this.result           = null;
        this.analysisStatus   = 'Analysis failed';
        this.errorMessage     =
          err?.error?.error ||
          err?.message ||
          'The AI analysis could not be completed. Please check the backend is running and your Gemini API key is configured.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Status badge CSS class ──────────────────────────────────
  getStatusClass(status: string): string {
    if (status === 'Healthy')         return 'status-healthy';
    if (status === 'Needs Attention') return 'status-attention';
    return 'status-critical';
  }
}
