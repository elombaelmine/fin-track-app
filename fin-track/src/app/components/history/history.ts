import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { CommonModule } from '@angular/common';

// Define the structure of your data to ensure type safety
interface Transaction {
  date: string;
  description: string;
  category: string;
  status: string;
  amount: number;
  type: 'income' | 'expense';
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class History implements OnInit {
  // Master list of all transactions
  private allTransactions: Transaction[] = [];
  
  // List actually rendered in the HTML
  transactions: Transaction[] = [];
  
  netIncome: number = 0;
  totalExpenses: number = 0;

  filters = {
    days: '30',
    category: 'all',
    status: 'all'
  };

  constructor(private apiService: ApiService) {}

 // In overview.ts
ngOnInit(): void {
    this.apiService.getTransactions().subscribe({
      next: (data: any) => {
        this.allTransactions = (data as Transaction[]) || [];
        // CHANGE THIS: Call the correct method for the History component
        this.applyFilters(); 
      },
      error: (err) => console.error('Error loading history:', err)
    });
  }

  calculateSummaries(): void {
    this.netIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  applyFilters(): void {
    // 1. Filter the master list based on dropdown state
    this.transactions = this.allTransactions.filter(t => {
      const matchCategory = this.filters.category === 'all' || 
                            t.category.toLowerCase() === this.filters.category.toLowerCase();
      const matchStatus = this.filters.status === 'all' || 
                          t.status.toLowerCase() === this.filters.status.toLowerCase();
      
      return matchCategory && matchStatus;
    });

    // 2. Re-calculate financial totals based on the filtered results
    this.calculateSummaries();
  }
}