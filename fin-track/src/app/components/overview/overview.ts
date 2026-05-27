import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';

interface Transaction {
  description: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  status?: string;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './overview.html',
  styleUrls: ['./overview.css']
})
export class Overview implements OnInit {
  username: string = 'Operator';
  totalBalance: number = 0;
  
  // Budget & Financial Metrics
  monthlyBudgetLimit: number = 500000; // Adjusted for XAF scale
  totalSpent: number = 0;
  
  // Calendar-Aware Variables
  daysLeft: number = 1;
  daysPassedInMonth: number = 1;
  totalDaysInCurrentMonth: number = 30;

  transactions: Transaction[] = [];
  isLoadingLedger = false;
  ledgerError = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCurrentOperator();
      this.refreshDashboardLedger();
    }
  }

  private loadCurrentOperator(): void {
    // Listens to the live stream from ApiService
    this.apiService.currentUser().subscribe({
      next: (user) => {
        if (user && user.username) {
          this.username = user.username.charAt(0).toUpperCase() + user.username.slice(1);
        }
      }
    });
  }

  refreshDashboardLedger(): void {
    this.isLoadingLedger = true;
    this.ledgerError = '';

    this.apiService.getTransactions().subscribe({
      next: (data: Transaction[]) => {
        this.transactions = data || [];
        this.runFinancialEngine();
        this.isLoadingLedger = false;
      },
      error: (err) => {
        console.error('Ledger sync error:', err);
        this.ledgerError = err?.error?.message || 'Could not load transactions right now.';
        this.transactions = [];
        this.runFinancialEngine();
        this.isLoadingLedger = false;
      }
    });
  }

  private runFinancialEngine(): void {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // 1. Calculate precise calendar days
    this.totalDaysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    this.daysPassedInMonth = today.getDate();
    this.daysLeft = Math.max(1, this.totalDaysInCurrentMonth - this.daysPassedInMonth);
    
    // 2. Aggregate current month transactions
    let income = 0;
    let expenses = 0;

    this.transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        if (tx.type === 'income') income += tx.amount;
        else expenses += tx.amount;
      }
    });

    this.totalBalance = income - expenses;
    this.totalSpent = expenses;
  }

  // Calculated Getters for Template Binding
  get dailyAverage(): number {
    return this.totalSpent / Math.max(1, this.daysPassedInMonth);
  }

  get projectedSpending(): number {
    return this.dailyAverage * this.totalDaysInCurrentMonth;
  }

  get budgetUsedPercent(): number {
    if (this.monthlyBudgetLimit <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((this.totalSpent / this.monthlyBudgetLimit) * 100));
  }

  get budgetStatusLabel(): string {
    if (this.budgetUsedPercent >= 90) {
      return 'Critical';
    }

    if (this.budgetUsedPercent >= 70) {
      return 'Watch closely';
    }

    return 'On track';
  }

  get budgetStatusClass(): string {
    if (this.budgetUsedPercent >= 90) {
      return 'critical';
    }

    if (this.budgetUsedPercent >= 70) {
      return 'warning';
    }

    return 'healthy';
  }

  getCategoryCost(categoryName: string): number {
    const today = new Date();
    return this.transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return tx.category.toLowerCase() === categoryName.toLowerCase() && 
               tx.type === 'expense' &&
               txDate.getFullYear() === today.getFullYear() &&
               txDate.getMonth() === today.getMonth();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  downloadReport(): void {
    if (!isPlatformBrowser(this.platformId) || this.transactions.length === 0) {
      return;
    }

    const rows = [
      ['Description', 'Category', 'Date', 'Type', 'Amount', 'Status'],
      ...this.transactions.map(tx => [
        tx.description,
        tx.category,
        tx.date,
        tx.type,
        tx.amount.toString(),
        tx.status || 'Completed'
      ])
    ];

    const csv = rows
      .map(row => row.map(value => this.escapeCsv(value)).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }
}
