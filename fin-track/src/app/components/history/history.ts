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

  ngOnInit(): void {
    this.apiService.getTransactions().subscribe({
      next: (data: any) => {
        this.allTransactions = (data as Transaction[]) || [];
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
    this.transactions = this.allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const earliestDate = new Date();
      earliestDate.setDate(earliestDate.getDate() - Number(this.filters.days));

      const matchDate = transactionDate >= earliestDate;
      const matchCategory = this.filters.category === 'all' || 
                            t.category.toLowerCase() === this.filters.category.toLowerCase();
      const matchStatus = this.filters.status === 'all' || 
                          (t.status || 'Completed').toLowerCase() === this.filters.status.toLowerCase();
      
      return matchDate && matchCategory && matchStatus;
    });

    this.calculateSummaries();
  }
}
