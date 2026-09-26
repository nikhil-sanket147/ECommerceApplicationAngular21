import { Component, ElementRef, HostListener, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../features/auth/auth.service';
import { CartService } from '../../../../features/cart/cart.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private toast = inject(ToastService);
  cartService = inject(CartService);

  user = this.authService.currentUser;
  isProfileOpen = signal<boolean>(false);

  isAdmin = computed(() => this.user()?.role?.toLowerCase() === 'admin');

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
        this.toast.info('You have been signed out successfully.', 'Signed Out');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.toast.info('You have been signed out.', 'Signed Out');
        this.router.navigate(['/login']);
      }
    });
  }
}