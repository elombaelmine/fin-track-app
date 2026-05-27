import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Pointing to your Node.js server
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  registerUser(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, payload);
  }

  loginUser(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, payload);
  }

  setCurrentUser(user: any) {
    this.currentUserSubject.next(user);
  }

  getTransactions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transactions`);
  }

  currentUser():Observable<any>{
    return this.http.get(`${this.apiUrl}/`)
  }
}