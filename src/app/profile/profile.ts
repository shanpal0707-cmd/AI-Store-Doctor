import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterLink }         from '@angular/router';
import { AuthService }        from '../services/auth.service';

@Component({
  selector:    'app-profile',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl:    './profile.css'
})
export class Profile implements OnInit {

  storeName    = '';
  businessType = '';
  storeSize    = '';
  primaryGoal  = '';
  fullName     = '';
  email        = '';
  hasData      = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // ── Store data from localStorage (unchanged this phase) ───
    const raw = localStorage.getItem('storeData');
    if (raw) {
      try {
        const data        = JSON.parse(raw);
        this.storeName    = data.storeName    || '';
        this.businessType = data.businessType || '';
        this.storeSize    = data.storeSize    || '';
        this.primaryGoal  = data.primaryGoal  || '';
        this.hasData      = !!this.storeName;
      } catch {
        this.hasData = false;
      }
    }

    // ── User identity: prefer AuthService signal (DB-backed) ──
    const dbUser = this.authService.currentUser();
    if (dbUser) {
      this.fullName = dbUser.fullName;
      this.email    = dbUser.email;
    } else {
      // Fallback: try fetching from backend (covers page-refresh case)
      this.authService.fetchMe().subscribe({
        next: (res) => {
          this.fullName = res.user.fullName;
          this.email    = res.user.email;
        },
        error: () => {
          // Backend not available or not logged in — fall back to localStorage
          const userRaw = localStorage.getItem('userData');
          if (userRaw) {
            try {
              const user    = JSON.parse(userRaw);
              this.fullName = user.fullName || '';
              this.email    = user.email    || '';
            } catch { /* leave empty */ }
          }
        }
      });
    }
  }
}
