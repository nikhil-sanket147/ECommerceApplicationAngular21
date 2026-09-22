import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../features/auth/auth.service';
import { CartDrawer } from '../../../../features/cart/cart-drawer/cart-drawer';
import { CartService } from '../../../../features/cart/cart.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CartDrawer],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  cartService = inject(CartService);

  // Directly references the currentUser signal managed by AuthService
  user = this.authService.currentUser;
  isProfileOpen = signal<boolean>(false);

  toggleProfile(): void {
    this.isProfileOpen.update((open) => !open);
  }

  closeProfile(): void {
    this.isProfileOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isProfileOpen.set(false);
    }
  }

onLogout(): void {
  this.isProfileOpen.set(false);

  this.authService.logout().subscribe({
    next: () => {
      this.router.navigate(['/login']);
    },
    error: () => {
      // Even if server returns 500/400, session was cleared by finalize()
      this.router.navigate(['/login']);
    }
  });
}
}