import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService }        from '../services/auth.service';

const SETTINGS_KEY = 'appSettings';

@Component({
  selector:    'app-settings',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl:    './settings.css'
})
export class Settings implements OnInit {

  // ── Notification preference ─────────────────────────────────
  notificationsEnabled = true;

  // ── Appearance preference ───────────────────────────────────
  appearance: 'default' | 'light' | 'dark' = 'default';

  // ── Save feedback ───────────────────────────────────────────
  savedMessage = '';

  constructor(
    private router:      Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) { return; }
    try {
      const saved = JSON.parse(raw);
      this.notificationsEnabled = saved.notificationsEnabled ?? true;
      this.appearance           = saved.appearance           ?? 'default';
    } catch { /* use defaults */ }
  }

  saveSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      notificationsEnabled: this.notificationsEnabled,
      appearance:           this.appearance
    }));
    this.savedMessage = 'Settings saved.';
    setTimeout(() => { this.savedMessage = ''; }, 2500);
  }

  logout(): void {
    // Call backend to clear the HttpOnly auth cookie
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('userData');
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if the backend call fails, clear local state and redirect
        localStorage.removeItem('userData');
        this.router.navigate(['/login']);
      }
    });
  }
}
