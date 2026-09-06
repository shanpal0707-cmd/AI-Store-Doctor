import { Component }       from '@angular/core';
import { FormsModule }     from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule }   from '@angular/common';
import { AuthService }    from '../services/auth.service';

@Component({
  selector:    'app-signup',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl:    './signup.css'
})
export class Signup {

  fullName        = '';
  email           = '';
  password        = '';
  confirmPassword = '';
  errorMessage    = '';
  successMessage  = '';
  isLoading       = false;

  constructor(
    private router:      Router,
    private authService: AuthService
  ) {}

  signUp(): void {
    this.errorMessage = '';

    // ── Client-side validation (mirrors backend rules) ──────
    if (!this.fullName.trim() || !this.email.trim() ||
        !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;

    // ── Call backend API ─────────────────────────────────────
    this.authService.signup(
      this.fullName.trim(),
      this.email.trim().toLowerCase(),
      this.password
    ).subscribe({
      next: (res) => {
        // Mirror to localStorage so existing components keep working.
        localStorage.setItem('userData', JSON.stringify({
          fullName: res.user.fullName,
          email:    res.user.email
        }));
        this.isLoading      = false;
        this.successMessage = 'Account created successfully.';
        setTimeout(() => this.router.navigate(['/home']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        // Show backend error message, or a generic fallback
        this.errorMessage =
          err?.error?.error ||
          'Could not create account. Please try again.';
      }
    });
  }
}
