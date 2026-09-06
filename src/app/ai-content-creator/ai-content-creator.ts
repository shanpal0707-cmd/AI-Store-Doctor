
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterLink }        from '@angular/router';
import { ContentService }    from '../services/content.service';
import { StoreService }      from '../services/store.service';
import { ProductService }    from '../services/product.service';

@Component({
  selector:    'app-ai-content-creator',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-content-creator.html',
  styleUrl:    './ai-content-creator.css'
})
export class AiContentCreator implements OnInit {

  // ==============================
  // STORE DATA
  // ==============================

  storeName  = 'My Store';
  storeData: any = {};

  // ==============================
  // PRODUCTS (loaded from DB / localStorage)
  // ==============================

  products: any[]      = [];
  selectedProduct: any = null;

  // ==============================
  // CONTENT OPTIONS
  // ==============================

  contentType   = 'Instagram Caption';
  tone          = 'Friendly';
  marketingGoal = 'Increase Sales';

  // ==============================
  // AI RESULT
  // ==============================

  generatedContent = '';
  headline         = '';
  callToAction     = '';
  marketingTips    = '';
  hashtags         = '';

  isGenerating = false;
  hasGenerated = false;
  errorMessage = '';

  constructor(
    private contentService:  ContentService,
    private storeService:    StoreService,
    private productService:  ProductService,
    private cdr:             ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStoreData();
    this.loadProducts();
  }

  // ==============================
  // LOAD STORE DATA — DB → localStorage fallback
  // ==============================

  private loadStoreData(): void {
    this.storeService.getStore().subscribe({
      next: (res) => {
        if (res.store) {
          this.storeData = res.store;
          this.storeName = res.store.storeName || 'My Store';
          localStorage.setItem('storeData', JSON.stringify(res.store));
        } else {
          this.loadStoreFromLocalStorage();
        }
      },
      error: () => this.loadStoreFromLocalStorage()
    });
  }

  private loadStoreFromLocalStorage(): void {
    const raw = localStorage.getItem('storeData');
    if (!raw) { return; }
    try {
      const data     = JSON.parse(raw);
      this.storeData = data;
      this.storeName = data.storeName || 'My Store';
    } catch (error) {
      console.error('[AI Content Creator] Store data error:', error);
    }
  }

  // ==============================
  // LOAD PRODUCTS — DB → localStorage fallback
  // ==============================

  private loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products = res.products;
        localStorage.setItem('products', JSON.stringify(this.products));
        if (this.products.length > 0 && !this.selectedProduct) {
          this.selectedProduct = this.products[0];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const raw = localStorage.getItem('products');
          this.products = raw ? JSON.parse(raw) : [];
        } catch {
          this.products = [];
        }
        if (this.products.length > 0 && !this.selectedProduct) {
          this.selectedProduct = this.products[0];
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ==============================
  // GENERATE CONTENT
  // ==============================

  generateContent(): void {
    this.errorMessage = '';

    if (!this.selectedProduct) {
      this.errorMessage = 'Please select a product first.';
      return;
    }

    this.isGenerating = true;
    this.hasGenerated = false;

    // Clear previous result
    this.generatedContent = '';
    this.headline         = '';
    this.callToAction     = '';
    this.marketingTips    = '';
    this.hashtags         = '';

    this.contentService.generate(
      this.storeData,
      this.selectedProduct,
      `${this.contentType} (Tone: ${this.tone})`,
      this.marketingGoal
    ).subscribe({
      next: (res) => {
        this.generatedContent = res.generatedContent  || '';
        this.headline         = res.suggestedHeadline || '';
        this.callToAction     = res.callToAction      || '';
        this.marketingTips    = Array.isArray(res.marketingTips)
          ? res.marketingTips.join(' • ')
          : '';
        this.hashtags = Array.isArray(res.hashtags)
          ? res.hashtags.join(' ')
          : '';
        this.hasGenerated = true;
        this.isGenerating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.error ||
          'Content generation failed. Please try again.';
        this.isGenerating = false;
        this.hasGenerated = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==============================
  // COPY CONTENT
  // ==============================

  compareProducts(a: any, b: any): boolean {
    if (!a || !b) { return false; }
    return (a._id && b._id && a._id === b._id) ||
           (a.id  && b.id  && String(a.id) === String(b.id));
  }

  copyContent(text: string): void {
    navigator.clipboard.writeText(text);
  }
}

