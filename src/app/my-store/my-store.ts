import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterLink }         from '@angular/router';
import { StoreService }       from '../services/store.service';

@Component({
  selector:    'app-my-store',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './my-store.html',
  styleUrl:    './my-store.css'
})
export class MyStore implements OnInit {

  storeName    = '';
  businessType = '';
  storeSize    = '';
  primaryGoal  = '';
  hasData      = false;

  constructor(private storeService: StoreService) {}

  ngOnInit(): void {
    // ── Try DB first ─────────────────────────────────────────
    this.storeService.getStore().subscribe({
      next: (res) => {
        if (res.store) {
          this.applyStore(res.store);
          // Keep localStorage in sync
          localStorage.setItem('storeData', JSON.stringify(res.store));
        } else {
          this.loadFromLocalStorage();
        }
      },
      error: () => this.loadFromLocalStorage()
    });
  }

  private applyStore(data: any): void {
    this.storeName    = data.storeName    || '';
    this.businessType = data.businessType || '';
    this.storeSize    = data.storeSize    || '';
    this.primaryGoal  = data.primaryGoal  || '';
    this.hasData      = !!this.storeName;
  }

  private loadFromLocalStorage(): void {
    const raw = localStorage.getItem('storeData');
    if (!raw) { return; }
    try {
      this.applyStore(JSON.parse(raw));
    } catch {
      this.hasData = false;
    }
  }
}
