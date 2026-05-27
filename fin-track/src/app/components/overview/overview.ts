import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  imports: [CommonModule],
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

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCurrentOperator();
      this.fetchDashboardLedger();
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

  private fetchDashboardLedger(): void {
    this.apiService.getTransactions().subscribe({
      next: (data: Transaction[]) => {
        this.transactions = data || [];
        this.runFinancialEngine();
      },
      error: (err) => {
        console.error('Ledger sync error:', err);
        this.transactions = []; // Keep empty to trigger empty-state view
        this.runFinancialEngine();
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
}