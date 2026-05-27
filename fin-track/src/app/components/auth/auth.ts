import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service'; 

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

  constructor(private apiService: ApiService, private router: Router) {}

  onSubmit() {
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

    this.apiService.registerUser(payload).subscribe({
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
        this.errorMessage = err.error?.message || 'An error occurred during registration.';
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

    this.apiService.loginUser(payload).subscribe({
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
        this.errorMessage = err.error?.message || 'Invalid operational credentials or security clearance key.';
      }
    });
  }
}