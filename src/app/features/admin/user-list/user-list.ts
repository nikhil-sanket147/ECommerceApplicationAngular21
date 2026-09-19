// src/app/features/admin/user-list/user-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { AdminService, AdminUserItem } from '../admin.service';
import { AuthService } from '../../auth/auth.service';

type SortColumn = 'sr' | 'name' | 'role' | 'status';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  users = signal<AdminUserItem[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  viewMode = signal<'table' | 'grid'>('table');

  // Search, Filter & Sort
  searchQuery = signal<string>('');
  selectedRoleFilter = signal<string>('ALL');
  sortColumn = signal<SortColumn>('sr');
  sortDirection = signal<SortDirection>('asc');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeOptions = [10, 20, 50, 100];

  // --- Metrics Computed Signals ---
  totalCount = computed(() => this.users().length);
  activeCount = computed(() => this.users().filter((u) => u.isActive).length);
  inactiveCount = computed(() => this.users().filter((u) => !u.isActive).length);
  adminCount = computed(() => this.users().filter((u) => u.role?.toLowerCase() === 'admin').length);

  // --- Filtered & Sorted Computed List ---
  filteredAndSortedUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const role = this.selectedRoleFilter();
    const col = this.sortColumn();
    const dir = this.sortDirection();

    let result = this.users().filter((user) => {
      const matchesRole = role === 'ALL' || user.role?.toLowerCase() === role.toLowerCase();
      const matchesSearch =
        !q ||
        user.firstName?.toLowerCase().includes(q) ||
        user.lastName?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.mobile?.includes(q);

      return matchesRole && matchesSearch;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (col === 'name') {
        const nameA = this.getFullName(a).toLowerCase();
        const nameB = this.getFullName(b).toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (col === 'role') {
        comparison = (a.role || '').localeCompare(b.role || '');
      } else if (col === 'status') {
        comparison = Number(b.isActive) - Number(a.isActive);
      }
      return dir === 'asc' ? comparison : -comparison;
    });

    return result;
  });

  // --- Paginated Slice ---
  paginatedUsers = computed(() => {
    const list = this.filteredAndSortedUsers();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filteredAndSortedUsers().length / this.pageSize()) || 1);

  currentLoggedInUserId = computed(() => this.authService.currentUser()?.userId);

  // Modals
  userToConfirm = signal<AdminUserItem | null>(null);
  userToDelete = signal<AdminUserItem | null>(null);
  userToEdit = signal<AdminUserItem | null>(null);
  editForm = signal<{ firstName: string; lastName: string; mobile: string; role: string }>({
    firstName: '',
    lastName: '',
    mobile: '',
    role: 'Customer'
  });
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

  // --- Sorting & Pagination Actions ---
  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedRoleFilter.set('ALL');
    this.currentPage.set(1);
  }

  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode.set(mode);
  }

  // --- Modals & Actions ---
  openConfirmModal(user: AdminUserItem): void {
    this.userToConfirm.set(user);
  }

  closeConfirmModal(): void {
    if (!this.isSubmitting()) this.userToConfirm.set(null);
  }

  confirmToggleStatus(): void {
    const user = this.userToConfirm();
    if (!user) return;

    this.isSubmitting.set(true);
    const wasActive = user.isActive;
    const action$ = wasActive ? this.adminService.deactivateUser(user.id) : this.adminService.activateUser(user.id);

    action$.subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.closeConfirmModal();
        this.fetchUsers();
        this.showSuccessNotification(this.parseMessage(res, wasActive ? 'User deactivated successfully.' : 'User activated successfully.'));
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.closeConfirmModal();
        this.errorMessage.set(this.parseError(err, 'Unable to update user status.'));
      }
    });
  }

  openDeleteModal(user: AdminUserItem): void {
    this.userToDelete.set(user);
  }

  closeDeleteModal(): void {
    if (!this.isSubmitting()) this.userToDelete.set(null);
  }

  confirmDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.isSubmitting.set(true);
    this.adminService.deleteUser(user.id).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.closeDeleteModal();
        this.fetchUsers();
        this.showSuccessNotification(this.parseMessage(res, 'User deleted successfully.'));
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.closeDeleteModal();
        this.errorMessage.set(this.parseError(err, 'Unable to delete user.'));
      }
    });
  }

  openEditModal(user: AdminUserItem): void {
    this.userToEdit.set(user);
    this.editForm.set({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      mobile: user.mobile || '',
      role: user.role || 'Customer'
    });
  }

  closeEditModal(): void {
    if (!this.isSubmitting()) this.userToEdit.set(null);
  }

  saveUserEdit(): void {
    const user = this.userToEdit();
    if (!user) return;

    const form = this.editForm();
    this.isSubmitting.set(true);

    const requests: Observable<any>[] = [
      this.adminService.updateUserProfile(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        mobile: form.mobile
      })
    ];

    if (form.role !== user.role) {
      requests.push(this.adminService.updateUserRole(user.id, form.role));
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeEditModal();
        this.fetchUsers();
        this.showSuccessNotification('User details updated successfully.');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.parseError(err, 'Failed to update user details.'));
      }
    });
  }

  private parseMessage(res: any, fallback: string): string {
    if (typeof res === 'string') {
      try {
        const parsed = JSON.parse(res);
        return parsed?.message || res;
      } catch {
        return res || fallback;
      }
    }
    return res?.message || fallback;
  }

  private parseError(err: any, fallback: string): string {
    return (typeof err?.error === 'string' ? err.error : err?.error?.message) || fallback;
  }

  private showSuccessNotification(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3500);
  }

  getFullName(user: AdminUserItem): string {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email?.split('@')[0] || 'Unknown';
  }

  getInitials(user: AdminUserItem): string {
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    return user.email?.charAt(0).toUpperCase() || 'U';
  }

  isSelf(user: AdminUserItem): boolean {
    return user.id === this.currentLoggedInUserId();
  }
}