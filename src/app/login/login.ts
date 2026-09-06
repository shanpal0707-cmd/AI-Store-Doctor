import { Component }           from '@angular/core';
import { FormsModule }         from '@angular/forms';
import { RouterLink, Router }  from '@angular/router';
import { CommonModule }        from '@angular/common';
import { AuthService }         from '../services/auth.service';

@Component({
  selector:    'app-login',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl:    './login.css'
})
export class Login {

  email        = '';
  password     = '';
  errorMessage = '';
  isLoading    = false;

  constructor(
    private router:      Router,
    private authService: AuthService
  ) {}

  logIn(): void {
    this.errorMessage = '';

    // ── Client-side validation ───────────────────────────────
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.isLoading = true;

    // ── Call backend API ─────────────────────────────────────
    this.authService.login(this.email.trim(), this.password).subscribe({
      next: (res) => {
        // Mirror user info to localStorage so existing components
        // (Profile, etc.) continue working until fully migrated.
        localStorage.setItem('userData', JSON.stringify({
          fullName: res.user.fullName,
          email:    res.user.email
        }));
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.error ||
          'Login failed. Please check your credentials and try again.';
      }
    });
  }
}
