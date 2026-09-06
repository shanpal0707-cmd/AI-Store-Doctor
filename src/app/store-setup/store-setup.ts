import { Component }       from '@angular/core';
import { FormsModule }     from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService }   from '../services/store.service';

@Component({
  selector:    'app-store-setup',
  standalone:  true,
  imports:     [FormsModule, RouterLink],
  templateUrl: './store-setup.html',
  styleUrl:    './store-setup.css'
})
export class StoreSetup {

  storeName    = '';
  businessType = '';
  storeSize    = '';
  primaryGoal  = '';

  constructor(
    private router:       Router,
    private storeService: StoreService
  ) {}

  continueToAIAnalysis(): void {

    if (
      !this.storeName.trim() ||
      !this.businessType ||
      !this.storeSize ||
      !this.primaryGoal
    ) {
      alert('Please complete all store details before continuing.');
      return;
    }

    const storeData = {
      storeName:    this.storeName.trim(),
      businessType: this.businessType,
      storeSize:    this.storeSize,
      primaryGoal:  this.primaryGoal
    };

    // ── Always mirror to localStorage for instant availability ──
    localStorage.setItem('storeData', JSON.stringify(storeData));

    // ── Save to DB (non-blocking — navigate immediately) ────────
    this.storeService.saveStore(storeData).subscribe({
      next: () => console.log('[StoreSetup] Store saved to database.'),
      error: (err) => console.warn('[StoreSetup] DB save failed (localStorage still updated):', err?.error?.error || err?.message)
    });

    this.router.navigate(['/dashboard']);
  }
}
