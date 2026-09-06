import { Component, OnInit } from '@angular/core';
import { FormsModule }        from '@angular/forms';
import { CommonModule }       from '@angular/common';
import { RouterLink }         from '@angular/router';
import { ProductService, ProductData } from '../services/product.service';

@Component({
  selector:    'app-products',
  standalone:  true,
  imports:     [FormsModule, CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrl:    './products.css'
})
export class Products implements OnInit {

  productName    = '';
  category       = '';
  costPrice:     number | null = null;
  sellingPrice:  number | null = null;
  stockQuantity: number | null = null;
  unitsSold:     number | null = null;
  salesPeriod    = 'Last 30 Days';

  message     = '';
  messageType = '';

  products: ProductData[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // ==============================
  // LOAD SAVED PRODUCTS
  // ==============================

  loadProducts(): void {
    // ── Try DB first ───────────────────────────────────────
    this.productService.getProducts().subscribe({
      next: (res) => {
        this.products = res.products;
        // Mirror to localStorage so AI pages work instantly
        localStorage.setItem('products', JSON.stringify(this.products));
      },
      error: () => {
        // DB unavailable — fall back to localStorage
        const saved = localStorage.getItem('products');
        this.products = saved ? JSON.parse(saved) : [];
      }
    });
  }

  // ==============================
  // ADD PRODUCT
  // ==============================

  addProduct(): void {

    if (
      !this.productName.trim() ||
      !this.category.trim() ||
      this.costPrice    === null ||
      this.sellingPrice === null ||
      this.stockQuantity === null ||
      this.unitsSold    === null
    ) {
      this.message     = 'Please complete all product details.';
      this.messageType = 'error';
      return;
    }

    const newProduct = {
      productName:   this.productName.trim(),
      category:      this.category.trim(),
      costPrice:     this.costPrice!,
      sellingPrice:  this.sellingPrice!,
      stockQuantity: this.stockQuantity!,
      unitsSold:     this.unitsSold!,
      salesPeriod:   this.salesPeriod
    };

    // ── Save to DB ────────────────────────────────────────
    this.productService.addProduct(newProduct).subscribe({
      next: (res) => {
        this.products = [...this.products, res.product];
        // Mirror updated list to localStorage
        localStorage.setItem('products', JSON.stringify(this.products));
        this.message     = 'Product added successfully!';
        this.messageType = 'success';
        this.clearForm();
      },
      error: (err) => {
        // DB unavailable — fall back to localStorage-only
        const localProduct: ProductData = { ...newProduct, id: Date.now() };
        this.products.push(localProduct);
        localStorage.setItem('products', JSON.stringify(this.products));
        this.message     = 'Product added (saved locally — database unavailable).';
        this.messageType = 'success';
        this.clearForm();
        console.warn('[Products] DB save failed:', err?.error?.error || err?.message);
      }
    });
  }

  private clearForm(): void {
    this.productName   = '';
    this.category      = '';
    this.costPrice     = null;
    this.sellingPrice  = null;
    this.stockQuantity = null;
    this.unitsSold     = null;
    this.salesPeriod   = 'Last 30 Days';
  }

  // ==============================
  // PROFIT PER UNIT
  // ==============================

  getProfit(product: ProductData): number {
    return product.sellingPrice - product.costPrice;
  }

  // ==============================
  // SALES RATE
  // ==============================

  getSalesRate(product: ProductData): number {
    const totalUnits = product.stockQuantity + product.unitsSold;
    if (totalUnits === 0) { return 0; }
    return Math.round((product.unitsSold / totalUnits) * 100);
  }

  // ==============================
  // PRODUCT HEALTH
  // ==============================

  getHealth(product: ProductData): number {
    const salesRate = this.getSalesRate(product);
    const profit    = this.getProfit(product);
    let score = 50;

    if      (salesRate >= 50) { score += 25; }
    else if (salesRate >= 25) { score += 15; }
    else                      { score -= 10; }

    if (profit > 0) { score += 20; }
    else            { score -= 25; }

    if (product.stockQuantity <= 10) { score -= 5; }

    return Math.max(0, Math.min(100, score));
  }

  // ==============================
  // HEALTH STATUS
  // ==============================

  getHealthStatus(product: ProductData): string {
    const health = this.getHealth(product);
    if (health >= 75) { return 'Healthy'; }
    if (health >= 50) { return 'Needs Attention'; }
    return 'Critical';
  }

  // ==============================
  // DELETE PRODUCT
  // ==============================

  deleteProduct(id: number | string | undefined): void {

    // ── DB delete (when _id is a MongoDB ObjectId string) ──
    const mongoId = typeof id === 'string' ? id : undefined;

    if (mongoId) {
      this.productService.deleteProduct(mongoId).subscribe({
        next: () => {
          this.products = this.products.filter(p => p._id !== mongoId);
          localStorage.setItem('products', JSON.stringify(this.products));
          this.message     = 'Product removed successfully!';
          this.messageType = 'success';
        },
        error: (err) => {
          console.warn('[Products] DB delete failed:', err?.error?.error || err?.message);
          // Still remove from local state so UI is consistent
          this.products = this.products.filter(p => p._id !== mongoId);
          localStorage.setItem('products', JSON.stringify(this.products));
          this.message     = 'Product removed (database unavailable).';
          this.messageType = 'success';
        }
      });
    } else {
      // localStorage-only product (numeric id)
      this.products = this.products.filter(p => p.id !== id);
      localStorage.setItem('products', JSON.stringify(this.products));
      this.message     = 'Product removed successfully!';
      this.messageType = 'success';
    }
  }
}
