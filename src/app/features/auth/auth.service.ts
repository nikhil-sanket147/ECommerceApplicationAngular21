import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, finalize, of, switchMap, tap, throwError } from 'rxjs';
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

      let profile = this.getUserFromStorage();
      if (!profile && token) {
        profile = this.getUserFromToken(token);
        if (profile) {
          this.saveProfile(profile);
        }
      }

      if (profile) {
        this.currentUser.set(profile);
      }
    }
  }

  // --- Storage & Token Helpers ---

  getAccessToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('accessToken') : null;
  }

  getRefreshToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('refreshToken') : null;
  }

  private getUserFromStorage(): UserProfileResponse | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem('userProfile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  getUserFromToken(token: string): UserProfileResponse | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      const rawRole =
        payload['role'] ||
        payload['roles'] ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        '';

      const role = Array.isArray(rawRole) ? rawRole[0] : String(rawRole || '');

      const email =
        payload['email'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        '';

      const userId =
        payload['nameid'] ||
        payload['sub'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        '';

      return { userId, email, role };
    } catch {
      return null;
    }
  }

  saveTokens(tokens: LoginResponseDTO): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.removeItem('token');
    }
    this.isAuthenticated.set(true);
  }

  saveProfile(profile: UserProfileResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
    this.currentUser.set(profile);
  }

  clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('token');
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  // --- Endpoints ---

  login(dto: LoginRequest): Observable<UserProfileResponse> {
    return this.http.post<LoginResponseDTO>(`${this.authApi}/login`, dto).pipe(
      tap((res) => {
        this.saveTokens(res);
        const tokenUser = this.getUserFromToken(res.accessToken);
        if (tokenUser) {
          this.saveProfile(tokenUser);
        }
      }),
      switchMap(() => this.getProfile())
    );
  }

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.authApi}/profile`).pipe(
      tap((profile) => this.saveProfile(profile))
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

  logout(): Observable<unknown> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return of(null);
    }

    return this.http.post(`${this.authApi}/logout`, { refreshToken }).pipe(
      finalize(() => {
        this.clearSession();
      })
    );
  }

  forgotPassword(dto: ForgotPasswordRequest): Observable<string> {
    return this.http.post(`${this.passwordApi}/forgot`, dto, {
      responseType: 'text'
    });
  }

  resetPassword(dto: ResetPasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.passwordApi}/reset`, dto);
  }
}