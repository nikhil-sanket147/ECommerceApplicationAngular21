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

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApi}/users/${id}`);
  }

  activateUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.adminApi}/activate-user/${id}`, {});
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.adminApi}/deactivate-user/${id}`, {});
  }

  updateUserRole(id: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.adminApi}/users/${id}/update-role`, { role });
  }
}