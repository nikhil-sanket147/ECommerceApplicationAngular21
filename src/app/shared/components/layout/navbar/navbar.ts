import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../../features/auth/auth.service';
import { CartService } from '../../../../features/cart/cart.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private toast = inject(ToastService);

  isDropdownOpen = signal<boolean>(false);

  currentUser = computed(() =>this.authService.currentUser());
  isAdmin = computed(() => this.currentUser()?.role.toLowerCase() === 'admin');
  cartCount = computed(() => this.cartService.cart()?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);

getUserInitials(): string {
  const user = this.currentUser();
  if (!user?.email) return 'U';

  const username = user.email.split('@')[0];
  const parts = username.split(/[._-]/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return username.slice(0, 2).toUpperCase();
}

getUserDisplayName(): string {
  const user = this.currentUser();
  if (!user?.email) return 'User';

  const username = user.email.split('@')[0];
  // Replaces dots/underscores with spaces and capitalizes words: "john.doe" -> "John Doe"
  return username
    .split(/[._-]/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

  toggleDropdown(): void {
    this.isDropdownOpen.update((v: any) => !v);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  openCart(): void {
    this.cartService.openDrawer();
  }

  signOut(): void {
    this.isDropdownOpen.set(false);
    this.authService.clearSession();
    this.toast.info('You have been signed out successfully.', 'Signed Out');
    this.router.navigate(['/login']);
  }
}
