import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Public fullscreen auth routes
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then(m => m.Register)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword)
  },

  // Authenticated shell layout (Navbar + Sidebar)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout/layout').then(m => m.Layout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'products'
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list/product-list').then(m => m.ProductList)
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/user-list/user-list').then(m => m.UserList)
      },
      {
  path: 'orders',
  loadComponent: () => import('./features/orders/order-list/order-list').then(m => m.OrderList)
}
    ]
  },

  // Fallback for unmatched routes
  {
    path: '**',
    redirectTo: 'products'
  }
];