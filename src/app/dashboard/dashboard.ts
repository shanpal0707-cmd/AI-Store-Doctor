import { Component, OnInit } from '@angular/core';
import { RouterLink }         from '@angular/router';
import { CommonModule }       from '@angular/common';
import { StoreService }       from '../services/store.service';
import { ProductService }     from '../services/product.service';

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.css'
})
export class Dashboard implements OnInit {

  // ── Store profile ──────────────────────────────────────────
  storeName    = 'My Store';
  businessType = 'Retail Business';
  storeSize    = 'Medium';
  primaryGoal  = 'Overall Business Analysis';

  // ── Product summary ────────────────────────────────────────
  productCount   = 0;
  healthyCount   = 0;
  attentionCount = 0;

  // ── Health score (derived from real product data) ──────────
  healthScore        = 0;
  healthScoreLabel   = 'No Data';
  healthScoreDesc    = 'Add your products and run an analysis to see your store health score.';
  productHealthPct   = 0;
  productHealthDesc  = 'No products added yet.';

  // ── AI Insights (driven by real product counts) ────────────
  insights: { number: string; title: string; description: string }[] = [];

  constructor(
    private storeService:   StoreService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadStoreData();
    this.loadProductMetrics();
  }

  // ── Load store profile: DB → localStorage fallback ────────
  private loadStoreData(): void {
    this.storeService.getStore().subscribe({
      next: (res) => {
        if (res.store) {
          this.storeName    = res.store.storeName    || 'My Store';
          this.businessType = res.store.businessType || 'Retail Business';
          this.storeSize    = res.store.storeSize    || 'Medium';
          this.primaryGoal  = res.store.primaryGoal  || 'Overall Business Analysis';
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
      const data = JSON.parse(raw);
      this.storeName    = data.storeName    || 'My Store';
      this.businessType = data.businessType || 'Retail Business';
      this.storeSize    = data.storeSize    || 'Medium';
      this.primaryGoal  = data.primaryGoal  || 'Overall Business Analysis';
    } catch { /* use defaults */ }
  }

  // ── Calculate metrics: DB → localStorage fallback ─────────
  private loadProductMetrics(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        localStorage.setItem('products', JSON.stringify(res.products));
        this.computeMetrics(res.products);
      },
      error: () => {
        const raw = localStorage.getItem('products');
        this.computeMetrics(raw ? JSON.parse(raw) : []);
      }
    });
  }

  private computeMetrics(products: any[]): void {
    this.productCount = products.length;

    if (this.productCount === 0) {
      this.buildInsights();
      return;
    }

    let totalScore = 0;
    products.forEach(product => {
      const score = this.calcHealthScore(product);
      totalScore += score;
      if (score >= 75) { this.healthyCount++; }
      else             { this.attentionCount++; }
    });

    this.healthScore = Math.round(totalScore / this.productCount);

    if      (this.healthScore >= 75) { this.healthScoreLabel = 'Good';       this.healthScoreDesc = 'Your store is performing well, but there are opportunities to improve.'; }
    else if (this.healthScore >= 50) { this.healthScoreLabel = 'Fair';       this.healthScoreDesc = 'Some products need attention. Review performance and take action.'; }
    else                             { this.healthScoreLabel = 'Needs Work'; this.healthScoreDesc = 'Several products are underperforming. An AI analysis is recommended.'; }

    this.productHealthPct  = Math.round((this.healthyCount / this.productCount) * 100);
    this.productHealthDesc = this.attentionCount === 0
      ? 'All your products are currently performing normally.'
      : `${this.attentionCount} product${this.attentionCount > 1 ? 's' : ''} may need your attention.`;

    this.buildInsights();
  }

  // ── Build AI Insights list ─────────────────────────────────
  private buildInsights(): void {
    this.insights = [];

    if (this.productCount === 0) {
      this.insights.push({ number: '01', title: 'Add Your Products',  description: 'Go to Product Doctor and add your product data to unlock AI-powered insights.' });
      this.insights.push({ number: '02', title: 'Run AI Analysis',    description: 'Once products are added, run the AI analysis to get personalised recommendations.' });
      return;
    }

    if (this.attentionCount > 0) {
      this.insights.push({ number: '01', title: `${this.attentionCount} Product${this.attentionCount > 1 ? 's' : ''} Need Attention`, description: 'Some products have low sales performance or profitability issues. Run an AI analysis for details.' });
    } else {
      this.insights.push({ number: '01', title: 'Product Performance', description: 'All products are currently healthy. Keep monitoring sales and inventory regularly.' });
    }

    this.insights.push({ number: '02', title: 'Inventory Check', description: this.attentionCount > 0 ? 'Some inventory may need attention before it becomes a business risk.' : 'Your inventory levels look stable across your product range.' });
    this.insights.push({ number: '03', title: 'AI Analysis Ready', description: `You have ${this.productCount} product${this.productCount > 1 ? 's' : ''} ready for a full AI diagnosis. Click "Analyze My Store" to begin.` });
  }

  // ── Health score formula (mirrors products.ts) ─────────────
  private calcHealthScore(product: any): number {
    const profit    = product.sellingPrice - product.costPrice;
    const total     = product.stockQuantity + product.unitsSold;
    const salesRate = total > 0 ? (product.unitsSold / total) * 100 : 0;
    let score = 50;
    if      (salesRate >= 50) { score += 25; }
    else if (salesRate >= 25) { score += 15; }
    else                      { score -= 10; }
    if (profit > 0) { score += 20; } else { score -= 25; }
    if (product.stockQuantity <= 10) { score -= 5; }
    return Math.max(0, Math.min(100, score));
  }
}
