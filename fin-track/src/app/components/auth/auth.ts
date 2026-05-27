import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service'; 
import { finalize } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})
export class Auth {
  authMode: 'login' | 'register' = 'login';
  showPassword = false; 

  formData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting = false;

  constructor(private apiService: ApiService, private router: Router) {}

  onSubmit() {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (this.authMode === 'register') {
      this.handleRegistration();
    } else {
      this.handleLogin();
    }
  }

  private handleRegistration() {
    if (!this.formData.username || !this.formData.email || !this.formData.password) {
      this.errorMessage = 'All operational input parameters are required.';
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Security credentials do not match.';
      return;
    }

    const payload = {
      username: this.formData.username.trim(),
      email: this.formData.email.trim(),
      password: this.formData.password
    };

    this.isSubmitting = true;

    this.apiService.registerUser(payload).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response: any) => {
        this.successMessage = 'Account provisioned successfully! Switching to login terminal...';
        setTimeout(() => {
          this.authMode = 'login';
          this.successMessage = '';
          this.formData.password = '';
          this.formData.confirmPassword = '';
        }, 2000);
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err, 'An error occurred during registration.');
      }
    });
  }

  private handleLogin() {
    if (!this.formData.username || !this.formData.password) {
      this.errorMessage = 'Username and security clearance key are required.';
      return;
    }

    const payload = {
      username: this.formData.username.trim(), 
      password: this.formData.password
    };

    this.isSubmitting = true;

    this.apiService.loginUser(payload).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response: any) => {
        this.successMessage = 'Access granted! Loading secure dashboard...';
        
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem('fintrack_token', response.token);
        }
        
        // Broadcast user down the pipeline stream
        this.apiService.setCurrentUser(response.user); 

        setTimeout(() => {
          this.router.navigate(['/overview']);
        }, 1200);
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err, 'Invalid credentials.');
      }
    });
  }

  get submitButtonLabel(): string {
    if (this.isSubmitting) {
      return this.authMode === 'login' ? 'Signing in...' : 'Creating account...';
    }

    return this.authMode === 'login' ? 'Initialize Secure Session' : 'Provision Account Token';
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (err?.status === 401) {
      return 'Invalid credentials. Check your username and password.';
    }

    if (err?.status === 0) {
      return 'Cannot reach the server. Make sure the backend is running on http://localhost:3000.';
    }

    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err?.error?.message) {
      return err.error.message;
    }

    if (err?.error?.error) {
      return err.error.error;
    }

    return fallback;
  }
}
