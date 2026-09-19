// src/app/features/admin/user-list/user-list.ts
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
  successMessage = signal<string | null>(null);
  viewMode = signal<'table' | 'grid'>('table');

  // Modal State
  userToConfirm = signal<AdminUserItem | null>(null);
  isSubmitting = signal<boolean>(false);

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

  openConfirmModal(user: AdminUserItem): void {
    this.userToConfirm.set(user);
  }

  closeConfirmModal(): void {
    if (!this.isSubmitting()) {
      this.userToConfirm.set(null);
    }
  }

  confirmToggleStatus(): void {
    const user = this.userToConfirm();
    if (!user) return;

    this.isSubmitting.set(true);
    const wasActive = user.isActive;

    const action$ = wasActive
      ? this.adminService.deactivateUser(user.id)
      : this.adminService.activateUser(user.id);

    action$.subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.closeConfirmModal();
        this.fetchUsers();

        // Parse message whether the API sends plain text or JSON
        let resolvedMessage = '';
        if (typeof res === 'string') {
          try {
            const parsed = JSON.parse(res);
            resolvedMessage = parsed?.message || res;
          } catch {
            resolvedMessage = res;
          }
        } else if (res && typeof res === 'object') {
          resolvedMessage = res.message || JSON.stringify(res);
        }

        // Fallback default if API returned empty body
        if (!resolvedMessage || resolvedMessage.trim() === '') {
          resolvedMessage = wasActive
            ? 'User deactivated successfully.'
            : 'User activated successfully.';
        }

        this.showSuccessNotification(resolvedMessage);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.closeConfirmModal();
        const errText = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.errorMessage.set(errText || 'Unable to update user status.');
      }
    });
  }

  private showSuccessNotification(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 3500);
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