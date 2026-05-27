import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  templateUrl: './add-transaction.html',
  styleUrls: ['./add-transaction.css']
})
export class AddTransaction implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {}

  /**
   * Structural placeholder for form submission.
   * Redirects back to the main overview panel after execution.
   */
  onSubmitTransaction(): void {
    console.log('Transaction entry captured structural placeholder.');
    this.router.navigate(['/overview']);
  }

  /**
   * Cancels the workflow and returns to the dashboard layout.
   */
  onCancel(): void {
    this.router.navigate(['/overview']);
  }
}