import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service'; // Adjust path if needed

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit {
  // Start empty so we can see when the stream fills it
  currentUsername: string = ''; 

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.currentUser().subscribe(user => {
      if (user && user.username) {
        this.currentUsername = user.username;
      }
    });
  }
}