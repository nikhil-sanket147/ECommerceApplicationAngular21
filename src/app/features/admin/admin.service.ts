// src/app/features/admin/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: string;
  isActive: boolean;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
  mobile: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private adminApi = `${environment.apiBaseUrl}/Admin`;

  getAllUsers(): Observable<AdminUserItem[]> {
    return this.http.get<AdminUserItem[]>(`${this.adminApi}/get-all-users`);
  }

  getUserById(id: string): Observable<AdminUserItem> {
    return this.http.get<AdminUserItem>(`${this.adminApi}/users/${id}`);
  }

  deleteUser(id: string): Observable<string> {
    return this.http.delete(`${this.adminApi}/users/${id}`, { responseType: 'text' });
  }

  activateUser(id: string): Observable<string> {
    return this.http.put(`${this.adminApi}/activate-user/${id}`, {}, { responseType: 'text' });
  }

  deactivateUser(id: string): Observable<string> {
    return this.http.put(`${this.adminApi}/deactivate-user/${id}`, {}, { responseType: 'text' });
  }

  updateUserRole(id: string, role: string): Observable<string> {
    return this.http.put(`${this.adminApi}/users/${id}/update-role`, { role }, { responseType: 'text' });
  }

  updateUserProfile(id: string, dto: UpdateUserProfileRequest): Observable<string> {
    return this.http.put(`${this.adminApi}/users/${id}/update-profile`, dto, { responseType: 'text' });
  }
}