import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponseDTO,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RegisterRequestDTO,
  ApiResponse
} from '../../core/models/auth.model';

export interface UserProfileResponse {
  userId: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private authApi = `${environment.apiBaseUrl}/Auth`;
  private passwordApi = `${environment.apiBaseUrl}/password`;

  isAuthenticated = signal<boolean>(false);
  currentUser = signal<UserProfileResponse | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getAccessToken();
      this.isAuthenticated.set(!!token);

      // Hydrate profile automatically on reload if token exists
      if (token) {
        this.getProfile().subscribe({
          error: () => this.clearSession()
        });
      }
    }
  }

  // --- Token & Session Management ---

  getAccessToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('accessToken') : null;
  }

  getRefreshToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('refreshToken') : null;
  }

  saveTokens(tokens: LoginResponseDTO): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.removeItem('token');
    }
    this.isAuthenticated.set(true);
  }

  clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  // --- Auth Endpoints ---

  login(dto: LoginRequest): Observable<UserProfileResponse> {
    return this.http.post<LoginResponseDTO>(`${this.authApi}/login`, dto).pipe(
      tap((res) => this.saveTokens(res)),
      switchMap(() => this.getProfile())
    );
  }

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.authApi}/profile`).pipe(
      tap((profile) => this.currentUser.set(profile))
    );
  }

  register(dto: RegisterRequestDTO): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.authApi}/register`, dto);
  }

  refreshToken(): Observable<LoginResponseDTO> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available.'));
    }

    return this.http
      .post<LoginResponseDTO>(`${this.authApi}/refresh-token`, { refreshToken })
      .pipe(
        tap((res) => this.saveTokens(res))
      );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.authApi}/logout`, { refreshToken }).subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      });
    } else {
      this.clearSession();
    }
  }

  // --- Password Endpoints ---

  forgotPassword(dto: ForgotPasswordRequest): Observable<string> {
    return this.http.post(`${this.passwordApi}/forgot`, dto, {
      responseType: 'text'
    });
  }

  resetPassword(dto: ResetPasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.passwordApi}/reset`, dto);
  }
}