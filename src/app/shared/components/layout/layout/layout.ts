import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../features/auth/auth.service';

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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}