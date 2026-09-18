import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminUserItem } from '../admin.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList implements OnInit {
  private adminService = inject(AdminService);

  users = signal<AdminUserItem[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  viewMode = signal<'table' | 'grid'>('table');

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load users list.');
        this.isLoading.set(false);
      }
    });
  }

  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode.set(mode);
  }

  toggleStatus(user: AdminUserItem): void {
    const action$ = user.isActive
      ? this.adminService.deactivateUser(user.id)
      : this.adminService.activateUser(user.id);

    action$.subscribe({
      next: () => this.fetchUsers(),
      error: () => alert('Unable to update user status.')
    });
  }

  getFullName(user: AdminUserItem): string {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email.split('@')[0];
  }

  getInitials(user: AdminUserItem): string {
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    return user.email.charAt(0).toUpperCase();
  }
}