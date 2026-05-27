import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BudgetCategory {
  name: string;
  icon: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'On Track' | 'Warning';
}

interface SavingsGoal {
  title: string;
  target: number;
  saved: number;
  achievedPct: number;
  deadline: string;
  suggestedMonthly: number;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget.html',
  styleUrls: ['./budget.css']
})
export class Budget implements OnInit {
  // Top level summary control variables mapped directly to wireframes
  totalMonthlyBudget: string = '$4,250.00';
  totalSpent: string = '$2,840.15';
  totalRemaining: string = '$1,409.85';
  daysLeft: number = 11;

  // Array storing categorical budget data rows
  categoryBudgets: BudgetCategory[] = [
    {
      name: 'Food & Dining',
      icon: '🍴',
      spent: 540,
      limit: 800,
      percentage: 67,
      status: 'On Track'
    },
    {
      name: 'Transport',
      icon: '🚌',
      spent: 285,
      limit: 300,
      percentage: 95,
      status: 'Warning'
    },
    {
      name: 'Shopping',
      icon: '🛍️',
      spent: 120,
      limit: 450,
      percentage: 26,
      status: 'On Track'
    }
  ];

  // Array storing saving objective configurations
  savingsGoals: SavingsGoal[] = [
    {
      title: 'Europe Summer Trip 2024',
      target: 5000,
      saved: 3250,
      achievedPct: 65,
      deadline: 'June 20, 2024',
      suggestedMonthly: 350
    },
    {
      title: 'Emergency Fund',
      target: 10000,
      saved: 9000,
      achievedPct: 90,
      deadline: 'No End Date',
      suggestedMonthly: 500
    }
  ];

  constructor() { }

  ngOnInit(): void { }
}