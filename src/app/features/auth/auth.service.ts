import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/auth`;

  currentUser = signal<string | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      this.isAuthenticated.set(true);
    }
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.currentUser.set(res.email);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}