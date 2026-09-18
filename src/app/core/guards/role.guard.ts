import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserProfileResponse } from '../../features/auth/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return true;
    }

    // 1. Current in-memory signal
    let user = authService.currentUser();

    // 2. Check localStorage 'userProfile'
    if (!user) {
      try {
        const stored = localStorage.getItem('userProfile');
        if (stored) {
          user = JSON.parse(stored) as UserProfileResponse;
          authService.currentUser.set(user);
        }
      } catch {
        user = null;
      }
    }

    // 3. Fallback: Parse directly from JWT accessToken
    if (!user) {
      const token = authService.getAccessToken();
      if (token) {
        user = authService.getUserFromToken(token);
        if (user) {
          authService.saveProfile(user);
        }
      }
    }

    // 4. Validate Role (case-insensitive)
    if (user && user.role) {
      const hasRole = allowedRoles.some(
        (r) => r.toLowerCase() === user!.role.toLowerCase()
      );
      if (hasRole) {
        return true;
      }
    }

    // Only bounce if token/role is genuinely unauthorized
    return router.createUrlTree(['/products']);
  };
};