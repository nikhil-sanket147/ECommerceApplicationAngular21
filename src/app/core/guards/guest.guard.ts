import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already authenticated, redirect to products
  if (authService.getAccessToken()) {
    return router.createUrlTree(['/products']);
  }

  // If not logged in, allow them to view the login/register page
  return true;
};