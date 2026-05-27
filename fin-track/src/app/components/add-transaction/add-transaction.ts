import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-transaction.html',
  styleUrls: ['./add-transaction.css']
})
export class AddTransaction implements OnInit {
  transaction = {
    description: '',
    amount: null as number | null,
    type: '',
    category: '',
    date: '',
    status: 'Completed'
  };

  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    this.transaction.date = localDate.toISOString().slice(0, 10);
  }

  onSubmitTransaction(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.transaction.description || !this.transaction.amount || !this.transaction.type || !this.transaction.category || !this.transaction.date) {
      this.errorMessage = 'Please complete all transaction fields.';
      return;
    }

    if (this.transaction.amount <= 0) {
      this.errorMessage = 'Amount must be greater than zero.';
      return;
    }

    this.isSubmitting = true;

    this.apiService.createTransaction(this.transaction).subscribe({
      next: () => {
        this.successMessage = 'Transaction saved successfully.';
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/overview']), 700);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not save this transaction.';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/overview']);
  }
}
