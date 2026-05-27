import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router} from '@angular/router';
import { AddTransaction } from '../add-transaction/add-transaction';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  imports: [RouterLink,RouterLinkActive]
})
export class Sidebar implements OnInit {

  constructor() { }
  router = inject(Router)

  ngOnInit(): void {
    // Structural init goes here later
  }

  onAddTransaction(): void {
  this.router.navigate(['/add-transaction']);
  }

}