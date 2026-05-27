import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  registerUser(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, payload);
  }

  loginUser(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, payload);
  }

  setCurrentUser(user: any) {
    this.currentUserSubject.next(user);
  }

  private getToken(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem('fintrack_token');
  }

  private authOptions() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  getTransactions(): Observable<any> {
    if (!this.getToken()) {
      return of([]);
    }

    return this.http.get(`${this.apiUrl}/transactions`, this.authOptions());
  }

  createTransaction(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions`, payload, this.authOptions());
  }

  currentUser():Observable<any>{
    const cachedUser = this.currentUserSubject.value;

    if (cachedUser) {
      return of(cachedUser);
    }

    if (!this.getToken()) {
      return of(null);
    }

    return this.http.get(`${this.apiUrl}/auth/me`, this.authOptions()).pipe(
      tap((user) => this.currentUserSubject.next(user)),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }
}
